import { UserRole, User } from './models/User';
import store from './store';
import io from 'socket.io-client';

/**
 * An event message to be send to the socket server
 * 
 * @interface ISocketMessage
 */
export interface ISocketMessage {
    event: string;
    receiverType: UserRole;
    content: any;
    
    receiverId?: string|number;
}

/**
 * A subscribable event to be received from the server
 * 
 * @interface ISocketEvent
 */
export interface ISocketEvent {
    id: number;
    event: string;
    callback(data: any): void;
}

/**
 * Manages the socket connection to the Notification server
 * 
 * @class NotificationSocket
 */
export class NotificationSocket {
    
    private SocketUrl: string;
    
    private socket: SocketIOClient.Socket
    
    private pingMessage: string;
    private pongMessage: string;
    
    private subscribedEvents: ISocketEvent[];
    private messageQueue: { event: string; content: string; }[];

    private checkAliveInterval: number;
    private pingTimeout: number;
    private reconnectTimeout: number;

    private lastPongTime: number;
    private lastReconnectTime: number;

    private intervalHandle: number;
    
    constructor(){
        
        this.SocketUrl = 'wss://socket.thuis.nl/';
        
        this.pingMessage = 'tits';
        this.pongMessage = 'ass';
        
        this.messageQueue = [];
        this.subscribedEvents = [];

        this.checkAliveInterval = 3000;
        this.pingTimeout = 10000;
        this.reconnectTimeout = 10000;

        this.lastPongTime = Date.now();
        this.lastReconnectTime = Date.now();
    }
    
    /**
     * Makes a connection to the socket server, registers your user account on it, and starts receiving events
     */
    connect() {
        var options: SocketIOClient.ConnectOpts = {
            forceNew: true,
            transports: ['polling', 'websocket']
        };

        //Check if the socket connection is alive on interval
        if(!this.intervalHandle){
            this.intervalHandle = setInterval(this.checkSocketAlive.bind(this), this.checkAliveInterval);
        }

        if(this.isConnected()){
            throw new Error('You already have an active socket connection. Close it before proceeding');
        }

        this.lastReconnectTime = Date.now();
        
        this.socket = io.connect(this.SocketUrl, options);
        
        this.socket.on('connect', this.socketConnect.bind(this));
        this.socket.on('disconnect', this.socketDisconnect.bind(this));
        this.socket.on('receivedEvent', this.socketReceivedEvent.bind(this));
    }

    /**
     * Breaks the connection to the socket server, the subscribed events will remain
     */
    disconnect() {
        
        if (!this.isConnected()) {
            return;
        }
        
        this.socket.removeAllListeners();
        this.socket.disconnect();

        if(this.intervalHandle){
            clearInterval(this.intervalHandle);
        }
    }
    
    /**
     * Checks if there is an active socket connection
     */
    isConnected(): boolean {
        return (this.socket && this.socket.connected);
    }

    /**
     * Subscribe a callback to a certain event type. The callback will be triggered once the event will be received over the socket
     * 
     * @param eventName - The name of the event you want to subscribe too
     * @param callback - Callback that will be fired once the event occurs
     * 
     * @return number - Returns an unique id that can be used to unsubscribe from the event
     */
    subscribe(eventName: string, callback: (data: any) => void): number {
        var uniqId = Date.now();
        
        this.subscribedEvents.push({
            id: uniqId,
            event: eventName,
            callback: callback
        });

        return uniqId;
    }

    /**
     * Unsubscribe from an event using the unique identifier
     * 
     * @param id - The unique id used to identify the event. Retrieved from the subscribe function
     */
    unsubscribe(id: number){
        this.subscribedEvents = this.subscribedEvents.filter((subEvent) => subEvent.id !== id);
    }
    
    /**
     * Send an event over the socket connection
     * 
     * @param message - The content of the event message
     */
    sendEvent(message: ISocketMessage) {
        message.content = encodeURIComponent(JSON.stringify(message.content));

        if(message.receiverId && typeof message.receiverId !== 'string'){
            message.receiverId = message.receiverId.toString();
        }
        
        this.sendCustomEvent('event', message);
    }

    /**
     * Send a message over the socket connection
     * 
     * @param type - Message name
     * @param content - Content of the message
     */
    sendCustomEvent(type: string, content: any){
        if(typeof(content) === 'object'){
            content = JSON.stringify(content);
        }

        if(!this.isConnected()){
            this.messageQueue.push({
                event: type,
                content: content
            });
            
            // Send KPI
            // this.KPI.send('clreqinvalidated');

            return;
        }

        this.socket.emit(type, content);
    }

    private socketConnect() {

        var user: User = store.state.authentication.user;

        if(!user){
            throw new Error('No user session exists. Can not connect to the socket server');
        }

        setTimeout(() => {

            this.socket.emit('user', {
                id: user.id,
                token: user.socketToken,
                type: user.roles[0]
            }, this.processQueue.bind(this));

            console.info('[NotificationSocket] Connected with user: ', user);
        }, 1000);
    }
    
    private socketDisconnect(reason: string) {
        console.info('[NotificationSocket] Disconnect with reason: ' + reason);
    }
    
    private socketReceivedEvent(data: string) {
        if(!data || data === '{}') {
            return;
        }

        var parsedData: ISocketMessage = JSON.parse(data);

        console.info('[NotificationSocket] Received the following event from the server: ', parsedData);

        if(!parsedData.event || this.isPongEvent(parsedData.event) || !parsedData.content){
            return;
        }

        parsedData.content = JSON.parse(decodeURIComponent(parsedData.content));

        this.processEvent(parsedData.event, parsedData.content);
    }

    private checkSocketAlive(){

        if(this.socket){
            this.socket.emit(this.pingMessage, '');
        }


        var timeSinceLastPong = Date.now() - this.lastPongTime;
        var timeSinceLastReconnect = Date.now() - this.lastReconnectTime;

        if(timeSinceLastPong > this.pingTimeout && timeSinceLastReconnect > this.reconnectTimeout){
            console.info('[NotificationSocket] Attempting to reconnect. Last pong: ' + timeSinceLastPong + ' Last Reconnect: ' + timeSinceLastReconnect);

            this.disconnect();
            this.connect();
        }
    }

    private isPongEvent(evt: string): boolean {

        if(evt === this.pongMessage){
            this.lastPongTime = Date.now();

            return true;
        }

        return false;
    }

    private processEvent(evt: string, content: Object){
        var matchingEvents = this.subscribedEvents.filter((subEvent) => subEvent.event === evt);

        matchingEvents.forEach((event) => event.callback(content));
    }
    
    private processQueue(){
        if(!this.isConnected() || this.messageQueue.length === 0){
            return;
        }
        
        var firstMessage = this.messageQueue.shift();

        if(!firstMessage){
            return;
        }
        
        this.socket.emit(firstMessage.event, firstMessage.content, this.processQueue.bind(this));
    }
}

const notificationSocket = new NotificationSocket();

export default notificationSocket;