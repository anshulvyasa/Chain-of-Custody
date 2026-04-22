import { createSlice, PayloadAction } from "@reduxjs/toolkit"

type InvestigatorType = "SPECIALADMIN" | "ADMIN" | "NORMAL" | "NONE";

export interface InvestigatorAuthorityType {
    investigatorAuthority: InvestigatorType
}

const AUTHORITY_MAP: Record<number, InvestigatorType> = {
    0: "SPECIALADMIN",
    1: "ADMIN",
    2: "NORMAL",
}

export interface InvestigatorPayload {
    idx: number;
    exist: boolean;
}

const initialState: InvestigatorAuthorityType = {
    investigatorAuthority: "NONE"
}

const investigatorAuthoritySlice = createSlice({
    name: "investigatorAuthority",
    initialState,
    reducers: {
        updateInvestigatorAuthorityReducer(state, action: PayloadAction<InvestigatorPayload>) {
            const { idx, exist } = action.payload;

            if (!exist) {
                state.investigatorAuthority = "NONE";
                return;
            }

            state.investigatorAuthority = AUTHORITY_MAP[idx] ?? "NONE";
        },
        resetInvestigatorReducer(state) {
            state.investigatorAuthority = "NONE";
        }
    }
})

export const { updateInvestigatorAuthorityReducer, resetInvestigatorReducer } = investigatorAuthoritySlice.actions;
export default investigatorAuthoritySlice.reducer;