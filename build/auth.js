"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPassportMiddleware = void 0;
const KoaPassport = require("koa-passport");
const PassportHttp = require("passport-http");
function createPassportMiddleware(ffs) {
    const passport = new KoaPassport.Passport();
    const basicAuth = new PassportHttp.BasicStrategy((username, password, done) => {
        try {
            const userProfile = ffs.getUserProfile(username);
            if (password === userProfile.password)
                done(null, userProfile.id);
            else
                done(null, false);
        }
        catch (err) {
            done(null, false);
        }
    });
    passport.use(basicAuth);
    return passport.authenticate('basic', { session: false });
}
exports.createPassportMiddleware = createPassportMiddleware;
//# sourceMappingURL=auth.js.map