import { ethers } from 'ethers';
import { CASE_CONTRACT_ABI } from '../contract';

export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export let provider: ethers.WebSocketProvider;
export let contract: ethers.Contract;

type ReconnectCallback = () => void;
const reconnectCallbacks: ReconnectCallback[] = [];

export const onReconnect = (cb: ReconnectCallback) => {
    reconnectCallbacks.push(cb);
};

export const initializeProvider = () => {
    try {
        provider = new ethers.WebSocketProvider("ws://localhost:8545");
        contract = new ethers.Contract(CONTRACT_ADDRESS, CASE_CONTRACT_ABI, provider);

        const ws = (provider as any).websocket;
        if (ws) {
            ws.onclose = () => {
                console.error("WebSocket connection closed. Reconnecting in 3 seconds...");
                setTimeout(() => {
                    initializeProvider();
                    reconnectCallbacks.forEach(cb => cb());
                }, 3000);
            };

            ws.onerror = (error: any) => {
                console.error("WebSocket error observed.");
            };
        }
    } catch (error) {
        console.error("Error initializing provider, retrying...", error);
        setTimeout(() => {
            initializeProvider();
            reconnectCallbacks.forEach(cb => cb());
        }, 3000);
    }
};

initializeProvider();
