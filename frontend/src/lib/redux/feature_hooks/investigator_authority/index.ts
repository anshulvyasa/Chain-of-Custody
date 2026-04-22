import { useAppDispatch, useAppSelector } from "../../hook"
import { InvestigatorPayload, resetInvestigatorReducer, updateInvestigatorAuthorityReducer } from "../../features/investigator_authority"

export const useInvestigatorAuthority = () => {
    const investigator = useAppSelector(state => state.investigatorAuthority)
    const dispatch = useAppDispatch();


    const updateInvestigatorAuthority = (data: InvestigatorPayload) => {
        dispatch(updateInvestigatorAuthorityReducer(data))
    }

    const resetInvestigatorAuthority = () => {
        dispatch(resetInvestigatorReducer())
    }


    return { investigator, updateInvestigatorAuthority, resetInvestigatorAuthority };
}

