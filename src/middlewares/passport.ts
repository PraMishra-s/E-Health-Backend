import passport from "passport";
import { setupJwtStrategy } from "../common/strageties/jwt.strategy";

const initializePassport = () =>{
    setupJwtStrategy(passport)
}

initializePassport()
export default passport;