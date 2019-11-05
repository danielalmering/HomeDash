import { Performer, PerformerStatus } from 'sensejs/performer/performer.model';
import { User } from './models/User';
import { hasService } from './util';

export function tabEnabled(service: string, forPerformer: Performer, user: User):boolean {
    if (!forPerformer){
        return false;
    }

    if(!user){
        return false;
    }

    //services:
    //cam,email,peek,phone,sms,videocall,voicemail
    //voyeur is an exception..
    if (service === 'voyeur'){
        return forPerformer.performerStatus !== PerformerStatus.Offline && forPerformer.isVoyeur;
    }
    
    if(!forPerformer.performer_services){
        return false;
    }

    if (!(service in forPerformer.performer_services) ){
        throw new Error(`${service} ain't no service I ever heard of!`);
    }

    // SMS tab disabled germany
    if(user.country === 'de' && service === 'sms'){
        return false;
    }

    // Email & sms enabled independently of status from performer!
    if(service === 'email' || service === 'sms'){
        return hasService(forPerformer, service);
    }

    if(forPerformer.performerStatus === PerformerStatus.Offline && service !== 'phone'){
        return false;
    }

    // If performer is calling no service enabled
    if(forPerformer.performerStatus === PerformerStatus.OnCall){
        return false;
    }

    // If performer is in request
    if(forPerformer.performerStatus === PerformerStatus.Request && (service === 'cam' || service === 'videocall')){
        return false;
    }

    // If performer is busy and cam or peek are enabled!
    if(forPerformer.performerStatus === PerformerStatus.Busy){
        return service === 'cam' && hasService(forPerformer, 'peek');
    }

    // The default scenario of status from services
    return  hasService(forPerformer, service); 

}