import { JanusJS, default as Janus }  from 'janus-gateway';
import Stream from '../streams/stream';
import { Component, Prop, Watch } from 'vue-property-decorator';
import { default as socket } from '../../../../socket';
import spinner from '../../../../assets/images/loader.gif';

interface Publisher{
    id: number;
    diplay: string;
    audio_codec: string;
    video_codec: string;
    talking: boolean;
}

interface Room{
    room:number;
    id: number;
    private_id: number;
    publishers?: Publisher[];
}

const debug = false;

@Component({
    template: '<div><video muted autoplay :poster="spinner" playsinline webkit-playsinline class="janus" style="width:100%;height:100%"></video></div>',
})
export class JanusPlay extends Stream{

    spinner = spinner;

    @Prop( { required: false } ) secret: string;

    intialize( {wowza='bla', playStream='pub', playToken='tok', element=false} = {}){
        this.wowza = wowza;
        this.playStream = playStream;
        this.playToken = playToken;
        if (element) this.initializeElement( element );

        this.iWannaPlay();
    }

    mounted(){
        this.initializeElement( this.$el.querySelector('.janus') );
        this.iWannaPlay();
    }

    // @Watch('playStream')
    // onPlaystreamSwitch(){
    //     this.flushLogs();
    //     this.janus.destroy({ unload:true });
    //     this.iWannaPlay();
    // }

    beforeDestroy(){
        this.flushLogs();
        this.janus.destroy({ unload:true });
    }

    destroyed(){
        console.log('destroy');
    }

    logs:{event:string,[rest: string]: any}[] = [];

    addLog( item:{event:string,[rest: string]: any} ){
        if (debug){
            console.log( item );
        }

        //let's first replace all spaces in the properties..
        for(const prop in item){
            if (typeof item[prop] !=='string'){
                continue;
            }

            if (item[prop].indexOf(' ') === -1){
                continue;
            }

            item[prop] = item[prop].replace(/ /g, '-');
        }

        item.t = Date.now();
        this.logs.push( item );
    }

    flushLogs(){
        if (!this.logs.length){
            return;
        }

        //flushing the logs..
        //first add the first 5 characters of the room to each log line, add a 'scope' of 'camback' to each line.
        this.logs.forEach( (log) => { log.r = this.playStream.substr(0,5); log.s='cam'; } );
        socket.sendEvent({
            content: this.logs,
            event: 'udplog',
            receiverType: undefined
        });

        this.logs = [];
    }

    private _state = 'constructing';

    private opaqueId = `vr-${Janus.randomString(12)}`;

    janus:Janus;
    roomPlugin:JanusJS.PluginHandle;

    publisherPlugin:JanusJS.PluginHandle;

    private async iWannaPlay(){
        try{
            //initialize Janus..
            await this.init();

            //connect to the websocket..
            this.janus = await this.connect();

            // now we need to emit this event now to comply with the flow of the other
            // transport types so to speak...
            this.state = 'connected';
            //attach the plugin...
            this.roomPlugin = await this.attachRoom();
            const room:Room = await this.joinRoom();

            this.publisherPlugin = await this.attachPublisher();

            const jsep = await this.joinPublisher( room.publishers[0], room.private_id );
            const sdp  = await this.answer( jsep );

            await this.startFeed(sdp);

            this.state = 'active';
        } catch( error ){
            if (error instanceof Error){
                this.onError( `${error.name} ${error.message}` );
            } else if (typeof error === 'string'){
                this.onError( error );
            } else {
                this.onError( 'General error');
            }

            this.state = 'disconnected';
        }

    }

    async init(){
        this.state = 'initializing';
        return new Promise( resolve=>{
            Janus.init( {
                debug: debug,
                callback: resolve
            } );
        } );
    }

    //create the Janus session, connecting to the signaling websocket
    async connect():Promise<Janus>{
        this.state = 'connecting';
        return new Promise( (resolve, reject)=>{
            const janus = new Janus({
                server: `wss://${this.wowza}/socket`,
                success: ()=>resolve(janus),
                error: (error)=>{
                    Janus.error( error );
                    reject( error );
                },
                destroyed: ()=>{
                    this.addLog({event:'JanusDestroyed'});
                    this.flushLogs();
                },
                iceServers: [],
                token: this.playToken,
                apisecret: this.secret
            });
        } );
    }

    async attachRoom():Promise<JanusJS.PluginHandle>{
        this.state = 'attaching_room';
        return new Promise( (resolve, reject)=>{
            this.janus.attach({
                success: (plugin)=> resolve(plugin),
                plugin: 'janus.plugin.videoroom',
                opaqueId: this.opaqueId,
                error: ( error )=>{
                    reject( error );
                },
                consentDialog: (on:boolean)=>{
                    this.addLog( {event:'consentDialog'});
                },
                mediaState: ( state, on )=>{
                    this.addLog({event:'RoomMediaState', state, on});
                },
                webrtcState: ( state )=>{
                    this.addLog({event:'RoomWrtcState', state});
                },
                iceState: ( state )=>{
                    this.addLog({event:'RoomIceState', state});
                },
                slowLink: ( state )=>{
                    this.addLog({event:'RoomSlowLink', state});
                },
                onmessage: this.onRoomMessage.bind(this),
                onlocalstream: (stream)=>this.addLog( {event:'LocalStream'}),
                onremotestream: (stream: MediaStream)=>{
                    this.addLog( { event:'RoomRemoteStream', id:stream.id, active:stream.active } );
                    this.attachStream( stream );
                },
                ondataopen: ()=>this.addLog( {event:'RoomDataOpen'} ),
                ondata: (msg:any)=>this.addLog({event:'RoomData'} ),
                oncleanup: ()=>this.addLog( {event:'RoomCleanup'} ),
                detached: ()=>this.addLog( {event:'RoomDetached'} )
            });
        });
    }

    async joinRoom():Promise<Room>{
        this.state = 'joining_room';
        return new Promise( (resolve, reject)=>{
            this.roomPlugin.send({
                message: {
                    request: 'join',
                    room: this.playStream,
                    ptype: 'publisher',
                    token: this.playToken,
                    id: this.playToken
                }
            });
            this._resolver = { resolve, reject };
            //todo: fix that timeout
        } );
    }

    async attachPublisher():Promise<JanusJS.PluginHandle>{
        this.state = 'attaching_publisher';
        return new Promise( (resolve, reject)=>{
            this.janus.attach({
                success: (handle) => resolve(handle),
                plugin: 'janus.plugin.videoroom',
                opaqueId: this.opaqueId,
                error: ( error )=>{
                    Janus.error( error );
                    reject( error );
                },
                onmessage: this.onPublisherMessage.bind(this),
                webrtcState: (on)=>this.addLog({event:'PublisherWEBRTCState', on} ),
                onremotestream: (stream)=>{
                    this.addLog( { event:'PublisherRemoteStream', id:stream.id, active:stream.active } );
                    this.attachStream(stream);
                },
                onlocalstream: (stream)=>this.addLog({event:'PublisherLocalStream'}),
                oncleanup: ()=>{
                    this.addLog({event:'PublisherCleanup'});
                    this.state = 'disconnected';
                    //sniff sniff what's that code-smell?
                    setTimeout( ()=>this.janus.destroy( {unload: true} ));
                },

                mediaState: ( state, on )=>{
                    this.addLog({event:'PublisherMediaState', state, on});
                },
                iceState: ( state )=>{
                    this.addLog({event:'PublisherIceState', state});
                },
                slowLink: ( state )=>{
                    this.addLog({event:'PublisherSlowLink', state});
                },
                ondataopen: ()=>this.addLog( {event:'PublisherDataOpen'} ),
                ondata: (msg:any)=>this.addLog({event:'PublisherData'} ),
                detached: ()=>this.addLog( {event:'PublisherDetached'} )

            });
        } );
    }

    async joinPublisher(publisher:Publisher, privateId:number):Promise<JanusJS.JSEP>{
        this.state = 'joining_publisher';
        (this.publisherPlugin as any)['videoCodec'] = publisher.video_codec;
        return new Promise( (resolve, reject)=>{
            this.publisherPlugin.send({
                message:{
                    request: 'join',
                    room: this.playStream,
                    ptype: 'subscriber',
                    feed: publisher.id,
                    private_id: privateId,
                    close_pc: true
                }
            });
            this._resolver = { resolve, reject };
        });
    }

    async answer(jsep:JanusJS.JSEP):Promise<string>{
        this.state = 'answering';
        return new Promise( (resolve, reject)=>{
            this.publisherPlugin.createAnswer({
                jsep,
                media: { audioSend: false, videoSend: false, audioRecv: true, videoRecv: true },	// We want recvonly audio/video
                success: (sdp:string)=>resolve(sdp),
                error: (error:any)=>{
                    console.log( error );
                    reject(error)
                }
            });
        });
    }

    async startFeed(sdp:string){
        this.state = 'starting_feed';
        return new Promise( (resolve, reject)=>{
            this._resolver = {resolve, reject};
            this.publisherPlugin.send({
                message: { request: 'start', room: this.playStream },
                jsep: sdp
            });
        });
    }

    video:HTMLVideoElement;

    playing: boolean = false;

    attachStream( stream:MediaStream ){
        if (!this.video){
            return;
        }

        if (this.playing){
            this.addLog({ event:'twitch' });
            return;
        }

        this.playing = true;

        try{
            this.video.srcObject = stream;
        }catch( e ){
            this.video.src = URL.createObjectURL(stream);
        }
    }

    initializeElement( e:unknown ){
        this.video = e as HTMLVideoElement;
    }

    onRoomMessage( message:JanusJS.Message, jsep?:JanusJS.JSEP ){
        const event:string = message['videoroom'];

        const { reject, resolve } = this._resolver || {} as any;
        if (message.error && reject){
            reject( message.error );
            this._resolver = undefined;
            return;
        }

        if (message.error){
            this.onError(message.error.message);
            return;
        }

        switch( event ){
            case 'joined':
                if (resolve){
                    this._resolver = undefined;
                    if (!message.publishers.length){
                        reject('no publishers yet? That is simply not possible');
                        return;
                    }
                    if (message.publishers.length > 1){
                        reject('Too many publishers? That should not be the case');
                        return;
                    }
                    resolve( message );
                }
                break;
            case 'destroyed':
                this.addLog({event});
                this.state = 'disconnected';
                break;
            case 'hangup':
                //well well well, what will we do then?
                this.addLog({event});
                this.state = 'disconnected';
                break;
            default:
                this.addLog( { ...{event:'UnhandledRoomMessage'}, ...message } );
        }
    }

    onPublisherMessage( message:JanusJS.Message, jsep?:JanusJS.JSEP ){
        const { resolve, reject } = this._resolver || {} as any;
        if (message.error && reject){
            reject(message.error);
            this._resolver = undefined;
            return;
        }
        if (message.error){
            this.onError(message.error.message);
            return;
        }

        const event = message['videoroom'];
        switch (event){
            case 'attached':{
                console.log( this._state );
                if (resolve) resolve( jsep );
                this._resolver = undefined;
                break;
            }
            case 'event':{
                if (message['started'] === 'ok'){
                    if (resolve) resolve();
                    this._resolver = undefined;
                } else {
                    this.addLog( { ...{event:'UnhandledPublishMessage'}, ...message } );
                }
                break;
            }

            default:
                this.addLog( { ...{event:'UnhandledPublishMessage'}, ...message } );
        }
    }

    get state():string{
        return this._state;
    }
    set state(value:string){
        this._state = value;
        this.addLog({event:'statechange', value});
        this.onStateChange( value );
    }

    static states = [
        'constructing',
        'initalizing',
        'connecting',
        'connected',
        'attaching',
        'joining_room',
        'attaching_publisher',
        'joining_publisher',
        'answering',
        'starting_feed',
        'active'
    ];

    private _resolver: { resolve?:Function, reject?:Function }  = undefined;

    public onError(message: string){
        this.addLog( { event: 'error', message } );
        this.$emit( 'error', message );
    }

}