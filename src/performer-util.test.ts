import * as test from 'tape';
import { tabEnabled } from './performer-util';
import { Performer, PerformerStatus, Role } from './models/Performer';

const performer: Performer = {
    'username': 'Een Performer',
    'roles': [Role.Performer],
    'socketToken': 'cb644eb332cf85203179e9e20788588f',
    'language': 'nl',
    'country': 'nl',
    'description': 'Hallo lieve mannen,\n\nDe koude dagen staan weer voor de deur maar samen kunnen wij binnen een gezellig feestje van maken kom jij ook Schatje?!\nIk ben Tatiana een meid van 24 jaar. Ik hou van spannende en ondeugende dingen. lekker teasen maar vooral heerlijk samen genieten. Ook ben ik gek op geile fantasie\u00ebn. of een leuke of geile babbel. IK CAM OOK MET GEZICHT!! . Heb jij zin om met mij te genieten schatje dan wacht ik op jou en maken wij er samen een feestje van!!\n\nDikke kus',
    'safeDescription': 'Hallo leuk mannen,\n\nDe zwoele avonden komen er weer aan lekker genieten van die heerlijk zwoele avonden??\nben jij in voor een leuke beeldchat !!! ... of wil je gezellig babbelen ik wacht op jou baby!!\nXOXO tatiana',
    'nickname': 'Eem Performer',
    'location': 'nl \/  \/ ',
    'eyeColor': 'blue',
    'id': 12345,
    'performer_services': {
        'cam': false,
        'phone': false,
        'sms': false,
        'email': false,
        'chat': false,
        'voicemail': false,
        'peek': false,
        'videocall': false,
        'callconfirm': false
    },
    'avatar': {
        'id': 65899,
        'name': '67c60d883de48b506392d54298e5a31519122912.PNG',
        'selected': false,
        'safe_version': true
    },
    'safe_avatar': {
        'id': 55855,
        'name': '8bff7f206ebed82d7e1f09b7bef1091502397709.JPG',
        'selected': false,
        'safe_version': true
    },
    'avatar_media': {
        'id': 145,
        'name': '12123_565173.mp4',
        'selected': false,
        'safe_version': false,
        'wowza_sync': true
    },
    'age': 25,
    'cupSize': 'medium',
    'weight': '58',
    'height': '168',
    'performerStatus': PerformerStatus.Busy,
    'performerLanguages': 'nl;',
    'isFavourite': false,
    'isVoyeur': false,
    'advert_numbers': [{
        'advertNumber': 34324
    }],
    'mediaId': 1,
    'userAgent': 'Chrome 63.0, Win8.1'
};

const services = ['cam', 'peek', 'email', 'sms', 'phone', 'videocall'];

test('util/tabEnabled', (assert: test.Test) => {

    //Performer in a 1on1 with peeking enabled
    const performerPeekable: Performer = { ...performer, performer_services: { ...performer.performer_services, cam: true, peek: true, phone: true }, performerStatus: PerformerStatus.Busy };
    const performerOnCall: Performer = { ...performer, performer_services: { ...performer.performer_services, cam: true, phone: true }, performerStatus: PerformerStatus.OnCall };
    const performerBusy: Performer = { ...performer, performer_services: { ...performer.performer_services, cam: true, phone: true }, performerStatus: PerformerStatus.Busy };
    const performerOffline: Performer = { ...performer, performer_services: { ...performer.performer_services }, performerStatus: PerformerStatus.Offline };
    const performerOfflineAllServices: Performer = { ...performer, performer_services: { ...performer.performer_services, phone: true, cam: true, videocall: true, sms: true, email: true }, performerStatus: PerformerStatus.Offline };
    const performerAvailable: Performer = { ...performer, performer_services: { ...performer.performer_services, cam: true, videocall: true, phone: true, sms: true, email: true }, performerStatus: PerformerStatus.Available };
    const performerAvailableNoServices: Performer = { ...performer, performer_services: { ...performer.performer_services, cam: false, videocall: false, phone: false, sms: false, email: false }, performerStatus: PerformerStatus.Available };

    const performerTeaser = { ...performer, isVoyeur: true };
    const performerNoTeaser = { ...performer, isVoyeur: false };
    const performerTeaserOffline = { ...performer, isVoyeur: true, performerStatus: PerformerStatus.Offline };

    const tests = [
        //Are tabs visible with peek enabled and while in session
        { expected: true, service: 'cam', performer: performerPeekable },
        { expected: false, service: 'videocall', performer: performerPeekable },
        { expected: false, service: 'phone', performer: performerPeekable },

        //Are tabs visible with on call performer
        { expected: false, service: 'cam', performer: performerOnCall },
        { expected: false, service: 'videocall', performer: performerOnCall },
        { expected: false, service: 'phone', performer: performerOnCall },

        //Are tabs visible with busy performer
        { expected: false, service: 'cam', performer: performerBusy },
        { expected: false, service: 'videocall', performer: performerBusy },
        { expected: false, service: 'phone', performer: performerBusy },

        //Are tabs visible with offline performer
        { expected: false, service: 'cam', performer: performerOffline },
        { expected: false, service: 'videocall', performer: performerOffline },
        { expected: false, service: 'phone', performer: performerOffline },

        //Are tabs visible with available performer
        { expected: true, service: 'cam', performer: performerAvailable },
        { expected: true, service: 'videocall', performer: performerAvailable },
        { expected: true, service: 'phone', performer: performerAvailable },
        { expected: true, service: 'email', performer: performerAvailable },
        { expected: true, service: 'sms', performer: performerAvailable },

        //Are tabs visible with available performer with all statusses off
        { expected: false, service: 'cam', performer: performerAvailableNoServices },
        { expected: false, service: 'videocall', performer: performerAvailableNoServices },
        { expected: false, service: 'phone', performer: performerAvailableNoServices },
        { expected: false, service: 'email', performer: performerAvailableNoServices },
        { expected: false, service: 'sms', performer: performerAvailableNoServices },

        //Are tabs visible with offline performer and all services on
        { expected: false, service: 'cam', performer: performerOfflineAllServices },
        { expected: false, service: 'videocall', performer: performerOfflineAllServices },
        { expected: true, service: 'phone', performer: performerOfflineAllServices },
        { expected: true, service: 'email', performer: performerOfflineAllServices },
        { expected: true, service: 'sms', performer: performerOfflineAllServices },

        //Is the teaser tab enabled properly
        { expected: true, service: 'voyeur', performer: performerTeaser },

        //Is the teaser tab disabled properly
        { expected: false, service: 'voyeur', performer: performerNoTeaser },

        //Is the teaser tab disabled properly when performer is offline
        { expected: false, service: 'voyeur', performer: performerTeaserOffline },
    ];

    // tests.forEach((test) => {
    //     const actual = tabEnabled(test.service, test.performer, 'de');
    //     assert.equal(actual, test.expected);
    // });

    assert.end();
});