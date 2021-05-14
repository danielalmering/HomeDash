import { Module } from 'vuex';

import { RootState } from './index';

import config, { host, login  } from '../config';

export interface DevicesState {
    devices: Array<string>;
}

const devicesStore: Module<DevicesState, RootState> = {
    state: {
        devices: []
    },
    getters: {
    },
    mutations: {
        setDevices: function(state: DevicesState, devices: any){
            state.devices = devices;
        }
    },
    actions: {
        getDevices: async function(store: any, type: string){
            const apiResult = await fetch(`${host}/json.htm?${login}type=devices&filter=light&used=true&order=Name`, {
                credentials: 'same-origin'
            });
            const apiData = await apiResult.json();

            store.commit('setDevices', apiData.result);
        },
        switchDevice: async function(store: any, device: any){
            const status = device.Data === 'Off' ? 'On' : 'Off';
            const switchDeviceResult = await fetch(`${host}/json.htm?${login}type=command&param=switchlight&idx=${device.idx}&switchcmd=${status}`, {
                credentials: 'same-origin'
            });

            store.dispatch('getDevices');
        },
        dimDevice: async function(store: any, device: any){
            const dimDeviceResult = await fetch(`${host}/json.htm?${login}type=command&param=switchlight&idx=${parseFloat(device.id)}&switchcmd=Set%20Level&level=${device.level}`, {
                credentials: 'same-origin'
            });
        }
    }
};

export default devicesStore;