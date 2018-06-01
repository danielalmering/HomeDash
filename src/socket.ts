import { UserRole, User } from './models/User';
import store from './store';
import config from './config';
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

    message?: string;
    senderType?: string;
    receiverId?: string | number;
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

    private socket: SocketIOClient.Socket;

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

        this.SocketUrl = config.SocketUrl;

        this.pingMessage = 'tits';
        this.pongMessage = 'ass';

        this.messageQueue = [];
        this.subscribedEvents = [];

        this.checkAliveInterval = 6000;
        this.pingTimeout = 15000;
        this.reconnectTimeout = 20000;

        this.lastPongTime = Date.now();
        this.lastReconnectTime = Date.now();
    }

    /**
     * Makes a connection to the socket server, registers your user account on it, and starts receiving events
     */
    connect() {
        const options: SocketIOClient.ConnectOpts = {
            forceNew: true,
            reconnection: true, //handle reconnections are self (ping pong)
            reconnectionDelay: 5000,
            reconnectionDelayMax: 10000,
            transports: ['polling','websocket']
        };

        //Check if the socket connection is alive on interval
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
        if (!this.socket) {
            console.log('Disconnecting socket disallowed');
            return;
        }

        this.socket.removeAllListeners();
        this.socket.disconnect();
        delete this.socket;

        if(this.intervalHandle){
            clearInterval(this.intervalHandle);

            delete this.intervalHandle;
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
        const uniqId = Date.now();

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

        const user: User = store.state.authentication.user;
        const loggedIn = store.getters.isLoggedIn;

        if(!user){
            throw new Error('No user session exists. Can not connect to the socket server');
        }

        this.processEvent('connected', {});

        setTimeout(() => {

            this.socket.emit('user', {
                id: user.id,
                token: user.socketToken,
                type: loggedIn ? user.roles[0] : 'ROLE_CLIENT'
            }, this.processQueue.bind(this));

            console.info('[NotificationSocket] Connected with user: ', user);

            this.processEvent('authenticated', {});

            if(!this.intervalHandle){
                this.intervalHandle = setInterval(this.checkSocketAlive.bind(this), this.checkAliveInterval);
            }
        }, 3000);
    }

    private socketDisconnect(reason: string) {
        console.info(`[NotificationSocket] Disconnect with reason: ${reason}`);

        this.processEvent('disconnected', {});
    }

    private socketReceivedEvent(data: string) {
        if(!data || data === '{}') {
            return;
        }

        const parsedData: ISocketMessage = JSON.parse(data);

        // console.info('[NotificationSocket] Received the following event from the server: ', parsedData);

        if(!parsedData.event || this.isPongEvent(parsedData.event) || (!parsedData.content && !parsedData.message)){
            return;
        }

        if(parsedData.event === 'msg'){
            parsedData.content = {
                receiverType: parsedData.receiverType,
                senderType: parsedData.senderType,
                message: parsedData.message
            };
        } else {
            parsedData.content = JSON.parse(decodeURIComponent(parsedData.content));
        }


        this.processEvent(parsedData.event, parsedData.content);
    }

    private checkSocketAlive(){

        if(this.isConnected()){
            this.socket.emit(this.pingMessage, '');
        }

        const timeSinceLastPong = Date.now() - this.lastPongTime;
        const timeSinceLastReconnect = Date.now() - this.lastReconnectTime;

        if(timeSinceLastPong > this.pingTimeout && timeSinceLastReconnect > this.reconnectTimeout){
            console.info(`[NotificationSocket] Attempting to reconnect. Last pong: ${timeSinceLastPong} Last Reconnect: ${timeSinceLastReconnect}`);

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
        const matchingEvents = this.subscribedEvents.filter((subEvent) => subEvent.event === evt);

        matchingEvents.forEach((event) => event.callback(content));
    }

    private processQueue(){
        if(!this.isConnected() || this.messageQueue.length === 0){
            return;
        }

        const firstMessage = this.messageQueue.shift();

        if(!firstMessage){
            return;
        }

        this.socket.emit(firstMessage.event, firstMessage.content, this.processQueue.bind(this));
    }
}

const notificationSocket = new NotificationSocket();

export default notificationSocket;
