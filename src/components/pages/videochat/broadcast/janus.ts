import Broadcast from './broadcast';
import {Component, Watch} from 'vue-property-decorator';
import { JanusJS, default as Janus }  from 'janus-gateway';
import { default as socket } from '../../../../socket';

interface Room{
    room:number;
    id: number;
    private_id: number;
    publishers?: {
        id: number;
        diplay: string;
        audio_codec: string;
        video_codec: string;
        talking: boolean;
    }[];
}

@Component({
    template: '<video playsinline muted webkit-playsinline autoplay :cam="true" :mic="false"></video>'
})
export class JanusCast extends Broadcast{

    @Watch('mic') onMicChanged(value: boolean | string, oldValue: boolean | string) {
        if (oldValue == value){
            return;
        }

        this.addLog( {event:"micchange", old:oldValue, current: value} );

        //let's not forget to switch the mic on wrtc level
        this.roomPlugin.send( {
            message: { request: 'configure', audio: !!value }
        } );
    }

    @Watch('cam') onCamChanged(value: string, oldValue: string) {
        if (oldValue ==  value){
            return;
        }

        this.addLog( {event:"camchange", old:oldValue, current: value} );

        if (typeof value !== 'string'){
            return;
        }
        //tell wrtc level to switch cam
    }

    mounted(){
        this.initializeElement( this.$el );
        this.toTheCast();
    }

    beforeDestroy(){
        this.destroy();
    }

    destroy(){
        this.state = 'destroying';

        if (this.roomPlugin){
            this.roomPlugin.send({
                message: { request: 'unpublish' }
            });
        } else if (this.janus) {
            this.janus.destroy( {unload: true} )
        }

        //flushing the logs..
        //first add the first 5 characters of the room to each log line, add a 'scope' of 'camback' to each line.
        this.logs.forEach( (log) => { log.r = this.publishStream.substr(0,5); log.s='cb' } )
        socket.sendEvent({
            content: this.logs,
            event: "udplog",
            receiverType: null
        })
        this.logs = [];
    }

    private _state = 'constructing'

    private opaqueId = `vr_${Janus.randomString(12)}`;

    janus:Janus;
    roomPlugin:JanusJS.PluginHandle;

    logs:{event:string,[rest: string]: any}[] = [];

    addLog( item:{event:string,[rest: string]: any} ){
        //let's first replace all spaces in the properties..
        for(let prop in item){
            if (typeof item[prop] != 'string'){
                continue;
            }
            
            if (item[prop].indexOf(" ") == -1){
                continue;
            }

            item[prop] = item[prop].replace(/ /g, '-');
        }

        item.t = Date.now();

        this.logs.push( item );
    }

    async toTheCast(){
        try{
            //initialize Janus..
            await this.init();

            //connect to the websocket..
            this.janus = await this.connect();

            // now we need to emit this event now to comply with the flow of the other
            // transport types so to speak...
            this.state = 'connected';
            //attach the plugin...
            this.roomPlugin = await this.attachRoomPlugin();

            await this.createRoom();
            await this.joinRoom();

            let jsep = await this.createOffer();
            jsep = await this.configure(jsep);
            await this.handleResponse( jsep );

            this.state = 'active';
        } catch( error ){
            this.onError( error );
            this.destroy();
        }
    }

    async init(){
        this.state = 'initializing';
        return new Promise( resolve=>{
            Janus.init( {
                debug: this.debug,
                callback: resolve
            } )
        } );
    }

    //create the Janus session, connecting to the signaling websocket
    async connect():Promise<Janus>{
        this.state = 'connecting';
        return new Promise<Janus>( (resolve, reject)=>{
            const janus = new Janus({
                server: `wss://${this.wowza}/socket`,
                success: ()=>resolve(janus),
                error: (error)=>{
                    reject( error );
                },
                destroyed: ()=>{
                    this.addLog({ event:"JanusDestroyed"});
                },
                iceServers: []
            })
        } );
    }

    async attachRoomPlugin():Promise<JanusJS.PluginHandle>{
        this.state = 'attaching';
        return new Promise<JanusJS.PluginHandle>( (resolve, reject)=>{
            this.janus.attach({
                success: (plugin)=>{
                    resolve(plugin)
                },
                plugin: 'janus.plugin.videoroom',
                opaqueId: this.opaqueId,
                error: ( error )=>reject( error ),
                consentDialog: (on:boolean)=>{
                    console.log('side effect om toestemming te vragen..');
                },
                mediaState: this.handleMediaState.bind(this),
                webrtcState: ( state )=>{
                    this.addLog({event:'wrctstate', state});
                    if (!state){
                        setTimeout( ()=>this.janus.destroy( {unload: true} ))
                    }
                },
                iceState: ( state )=>{
                    this.addLog({event:"icestate", state});
                    if (state == "disconnected"){
                        const { reject } = this._resolver || {};
                        if (reject) reject("ice connection disconnected");
                    }
                },
                slowLink: ( state )=>{
                    this.addLog({event:"slowlink", state});
                },
                onmessage: this.onRoomMessage.bind(this),
                onlocalstream: this.attachCamera.bind(this),
                onremotestream: (stream: MediaStream)=>{
                    this.addLog( {event:"remotestream"});
                },
                ondataopen: ()=>this.addLog( {event:"dataopen"}),
                ondata: (msg:any)=>this.addLog( {event:"datain"}),
                oncleanup: ()=>{
                    if (!this.video) return;
                    const tracks = (this.video.srcObject as MediaStream).getTracks();
                    if (!tracks) return;

                    tracks.forEach( (track)=>{
                        track.stop();
                    });
                },
                detached: ()=>this.addLog( {event:"detached"})
            });
        });
    }

    async createRoom():Promise<Room>{
        this.state = 'creating';
        return new Promise<Room>( (resolve, reject)=>{
            this.roomPlugin.send({
                message: {
                    request: 'create',
                    room: this.publishStream,
                    is_private: true,
                    audiocodec: 'opus',
                    videocodec: 'h264',
                    record: false
                },
                success: (result)=>{
                    if (result.videoroom == 'created') {
                        resolve();
                    } else if (result.error && result.error_code == 427) {
                        //this means the room already exists; continue normally with joining the room.
                        resolve();
                    } else {
                        reject(result.error);
                    }
                },
                error: (message)=>{
                    reject(message);
                }
            })
            
        })
    }

    async joinRoom():Promise<Room>{
        this.state = 'joining';
        return new Promise<Room>( (resolve, reject)=>{
            this.roomPlugin.send({
                message: {
                    request: 'join', 
                    room: this.publishStream,
                    ptype: 'publisher',
                    display: this.publishToken
                }
            });
            this._resolver = { resolve, reject };
            //todo: fix that timeout!
        })
    }

    async createOffer():Promise<string>{
        this.state = 'offering';
        return new Promise<string>( (resolve, reject)=>{
            this.roomPlugin.createOffer({
                media: { audioRecv: false, videoRecv: false, audioSend: true, videoSend: true }, 
                success: (jsep:string)=> resolve( jsep ),
                error: (error:any)=>reject(error)
            })
        });
    }

    async configure(jsep:string):Promise<string>{
        this.state = 'configuring';
        return new Promise<string>( (resolve, reject)=>{
            this.roomPlugin.send({
                message: {
                    request: 'configure', 
                    audio: !!this.mic,
                    video: true,
                    data: false,
                    bitrate: 1024 * 1000//kbits
                },
                error: (message)=>{
                    reject(message);
                    this._resolver = null;
                },
                jsep
            })
            this._resolver = { resolve, reject };
        })
    }

    async handleResponse(jsep:string){
        this.state = 'setting_remote_description';
        return new Promise( (resolve, reject)=>{
            this.roomPlugin.handleRemoteJsep( {jsep} );
            this._resolver = { resolve, reject };
        })
    }

    video:HTMLVideoElement;

    initializeElement( e:any ){
        this.video = e as HTMLVideoElement;
        this.video.onended = ()=>{
            this.addLog( {event:"videoend"} );
            this.janus.destroy( {} )
        }
    }

    handleMediaState( type: 'video' | 'audio', on:boolean ){
        if ( 
            (this._state == 'setting_remote_description')
            &&
            type == 'video'
            &&
            this._resolver 
        ){
            const {resolve, reject} = this._resolver;
            if( on ){
                resolve()
            } else {
                reject()
            }
        } else {
            this.addLog({event:"unhandledMediaState", type, on} );
        }
    }
    attachCamera( stream:MediaStream ){
        if (!this.video){
            return;
        }
        try{
            this.video.srcObject = stream;
        }catch( e ){
            this.video.src = URL.createObjectURL(stream);
        }
    }

    onRoomMessage( message:JanusJS.Message, jsep?:JanusJS.JSEP ){        
        const event:string = message['videoroom'] ;
        const { reject, resolve } = this._resolver || {} as any;
        if (message.error && reject){
            reject( message.error );
            this._resolver = null;
            return;
        }

        if (message.error){
            this.addLog( {...message, ...{event:"unhandledRoomError"}})
            //this.onError(message);
            return;
        }

        switch( event ){
            case 'joined':
                if (resolve){
                    resolve( message );
                    this._resolver = null;
                }
                break;
            case 'event': 
                if (message['configured'] == 'ok'){
                    resolve && resolve(jsep);
                    this._resolver = null;
                } else if( message['unpublished'] == 'ok'){
                    //ok het unpublishen is gebeurd, en nu..
                } else {
                    this.addLog( {...message, ...{event:"unhandledRoomMessage"} })
                }
                break;

            default:
                this.addLog( {...message, ...{event:"unhandledRoomMessage"} });
        }
    }

    get state():string{
        return this._state;
    }
    set state(value:string){
        this.addLog({event:"statechange", value});
        //destroying is always alowed
        //otherwise, the order of states should be obeyed
        if (value != "destroying"){
            const current = JanusCast.states.indexOf(this._state);
            const next = JanusCast.states.indexOf(value);
            if (next - current != 1){
                throw new Error(`invalid state change from ${this._state} to ${value}`);
            }
        }

        this._state = value;
        this.onStateChange( value );
    }

    static states = [ 
        'initializing',
        'connecting',
        'connected',
        'attaching',
        'creating',
        'joining',
        'offering',
        'configuring',
        'setting_remote_description',
        'active',
        'destroying'
    ];

    private _resolver:{resolve:Function, reject:Function} | null = null;

    public onError(message: string){
        this.addLog({event:"error", message});
        this.$emit('error', message);
    }
}