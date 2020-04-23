import Broadcast from './broadcast';
import {Component, Watch} from 'vue-property-decorator';
import { JanusJS, default as Janus }  from 'janus-gateway';

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

        //let's not forget to switch the mic on wrtc level
        this.roomPlugin.send( {
            message: { request: 'configure', audio: !!value }
        } );
    }

    @Watch('cam') onCamChanged(value: string, oldValue: string) {
        console.log(`cam was ${oldValue} en is ${value}`)
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
        this.roomPlugin.send({
            message: { request: 'unpublish' }
        });
   
    }

    private _state = 'constructing'

    private opaqueId = `videoroom${Janus.randomString(12)}`;

    janus:Janus;
    roomPlugin:JanusJS.PluginHandle;

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
            this.state = 'disconnected';
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
                    Janus.error( error );
                    reject( error );
                },
                destroyed: ()=>{
                    console.log('Janus destroyed');
                }
            })
        } );
    }

    async attachRoomPlugin():Promise<JanusJS.PluginHandle>{
        this.state = 'attaching';
        return new Promise<JanusJS.PluginHandle>( (resolve, reject)=>{
            this.janus.attach({
                success: (plugin)=>{
                    console.log('Room: Attaching plugin success');
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
                    console.log(`wrct state: ${state}`);
                    if (!state){
                        setTimeout( ()=>this.janus.destroy( {unload: true} ))
                    }
                },
                iceState: ( state )=>{
                    console.log(`ice state: ${state}`);
                },
                slowLink: ( state )=>{
                    console.log(`slow link: ${state}`);
                },
                onmessage: this.onRoomMessage.bind(this),
                onlocalstream: this.attachCamera.bind(this),
                onremotestream: (stream: MediaStream)=>{
                    console.log('Room: remote stream! Not da bedooling');
                },
                ondataopen: ()=>console.log('Room: data open?'),
                ondata: (msg:any)=>console.log(`Room: Data ${msg} coming in??`),
                oncleanup: ()=>{
                    if (!this.video) return;
                    const tracks = (this.video.srcObject as MediaStream).getTracks();
                    if (!tracks) return;

                    tracks.forEach( (track)=>{
                        track.stop();
                    });
                },
                detached: ()=>console.log('Room: I feel detached')
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
                    console.log('Room: Create fout!!');
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
            console.log('Video is ended! That\'s nice..');
            this.janus.destroy( {} )
        }
    }

    handleMediaState( type: 'video' | 'audio', on:boolean ){
        console.log(`media state ${type} ${on}`)
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
        console.log(`ROOM ${event}`);
        if (!event){
            console.log('Room: plugin message without event???');
            console.log( message );
            console.log( jsep );
        }

        const { reject, resolve } = this._resolver || {} as any;
        if (message.error && reject){
            reject( message.error );
            this._resolver = null;
            return;
        }

        if (message.error){
            console.log('omygod een error!');
            console.log(message);
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
            case 'incomingcall':
                if (this._resolver){
                    this._resolver.resolve(jsep);
                    this._resolver = null;
                }
                break;
            case 'accept':
                console.log('Room: accepted something??');
                break;
            case 'event': 
                console.log('Room: an event just entered the building');
                console.log( message );
                if (message['configured'] == 'ok'){
                    resolve && resolve(jsep);
                    this._resolver = null;
                } else if( message['unpublished'] == 'ok'){
                    //ok het unpublishen is gebeurd, en nu..
                } else {
                    console.log('Room: an event just entered the building');
                    console.log( message );
                }
                break;

            default:
                console.log('Room: unhandled event:');
                console.log(message.result);
        }
    }

    get state():string{
        return this._state;
    }
    set state(value:string){
        this._state = value;
        console.log(`STATE now is ${value}`);
        this.onStateChange( value );
    }

    static states = [
        'constructing', 'initalizing', 'connecting'
    ]

    private _resolver:{resolve:Function, reject:Function} | null = null;


}