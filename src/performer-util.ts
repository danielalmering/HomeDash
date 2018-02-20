import { Performer, PerformerStatus } from "./models/Performer";

export function tabEnabled(service: string, forPerformer: Performer):boolean { 
    if (!forPerformer){
        return false;
    }

    //services:
    //cam,email,peek,phone,sms,videocall,voicemail
    //voyeur is an exception..
    if (service === 'voyeur'){
        return forPerformer.performerStatus !== PerformerStatus.Offline && forPerformer.isVoyeur;
    }

    if (!(service in forPerformer.performer_services) ){
        throw new Error(`${service} ain't no service I ever heard of!`);
    }

    // Email & sms enabled independently of status from performer!
    if(service === 'email' || service === 'sms'){
        return forPerformer.performer_services[service];
    }

    // If performer is calling no service enabled
    if(forPerformer.performerStatus === PerformerStatus.OnCall){
        return false;
    }

    // If performer is busy and cam or peek are enabled!
    if(forPerformer.performerStatus === PerformerStatus.Busy){
        return service === 'cam' && forPerformer.performer_services['peek'];
    }

    // The default scenario of status from services
    return forPerformer.performer_services[service];

}