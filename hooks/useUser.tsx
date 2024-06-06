import { Subscription, userDetails } from "@/types";
import { User } from "@supabase/auth-helpers-nextjs";
import { useSessionContext, useUser as useSupaUser } from "@supabase/auth-helpers-react";
import { createContext, useState, useEffect, useContext } from "react";

type UserContextType = {
    accessToken: string | null;
    user: User | null;
    userDetails: userDetails | null;
    isLoading: boolean;
    subscription: Subscription | null;
}

export const UserContext = createContext<UserContextType | undefined>(
    undefined
);

export interface Props {
    [propName: string]: any;
}

export const MyUserContextProvider = (props: Props) => {
    const {
        session,
        isLoading: isLoadingUser,
        supabaseClient: supabase
    } = useSessionContext(); 

    const user = useSupaUser();
    const accessToken = session?.access_token ?? null;
    const [isLoadingData, setLoadingData] = useState(false);
    const [userDetails, setUserDetails] = useState<userDetails | null>(null);
    const [subscription, setSubscription] = useState<Subscription | null>(null);


    const getUserDetails = () => supabase.from('user').select('*').single();
    const getSubscription = () => supabase.from('subscription').select('*, price(*, product(*))').in('status', ['trialing', 'active']).single();

    useEffect(() => {
      if(user && !isLoadingData && !userDetails && !subscription){
        setLoadingData(true)
        Promise.allSettled([getUserDetails(), getSubscription()]).then(
            (result) => {
                const userDetailsPromise = result[0];
                const subscriptionPromise = result[1];

                if(userDetailsPromise.status === "fulfilled"){
                    setUserDetails(userDetailsPromise.value.data as userDetails)
                }

                if(subscriptionPromise.status === "fulfilled"){
                    setSubscription(subscriptionPromise.value.data as Subscription)
                }

                setLoadingData(false);
            }
        )
      } else if(!user && !isLoadingData && !isLoadingUser) {
        setUserDetails(null);
        setSubscription(null);
      }
    }, [user, isLoadingUser]);

    const value = {
        accessToken,
        user,
        userDetails,
        isLoading: isLoadingData || isLoadingUser,
        subscription
    }
    return <UserContext.Provider value={value} {...props} />
}

export const useUser = () => {
    const context = useContext(UserContext);
    if(context === undefined){
        throw new Error('useUser must be used within a MyUserContextProvider')
    }

    return context;
}