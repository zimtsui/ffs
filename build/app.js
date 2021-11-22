"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const Koa = require("koa");
const router_1 = require("./routes/router");
const Database = require("better-sqlite3");
const ffs_1 = require("./ffs/ffs");
const auth_1 = require("./auth");
const users_1 = require("./users");
const Cors = require("@koa/cors");
const Session = require("koa-session");
class App extends Koa {
    constructor() {
        super();
        this.db = new Database('../functionote.db', { fileMustExist: true });
        this.ffs = new ffs_1.FunctionalFileSystem(this.db);
        this.users = new users_1.Users(this.db);
        this.router = new router_1.Router(this.ffs, this.users);
        this.passport = new auth_1.Passport(this.users);
        this.use(Cors());
        this.use(Session({
            signed: false,
            overwrite: false,
        }, this));
        this.use(this.passport.initialize());
        // this.use(this.passport.session());
        // this.use(this.passport.authenticate('basic', { session: true }));
        this.use(this.router.routes());
    }
}
exports.App = App;
//# sourceMappingURL=app.js.map