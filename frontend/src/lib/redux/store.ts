import { configureStore } from '@reduxjs/toolkit'
import investigatorAuthorityReducer from "./features/investigator_authority";

export const makeStore = () => {
    return configureStore({
        reducer: {
            investigatorAuthority: investigatorAuthorityReducer
        }
    })
}


export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']