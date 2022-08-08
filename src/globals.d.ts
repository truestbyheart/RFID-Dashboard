declare global {
    interface Window {
        __TAURI__: {
            invoke: (arg: string) => Promise<any>
        }
    }
}

export { }