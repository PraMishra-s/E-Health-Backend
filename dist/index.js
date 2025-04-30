"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const app_config_1 = require("./config/app.config");
const asyncHandler_1 = require("./middlewares/asyncHandler");
const errorHandler_1 = require("./middlewares/errorHandler");
const http_config_1 = require("./config/http.config");
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const auth_route_1 = __importDefault(require("./modules/auth/auth.route"));
const passport_1 = __importDefault(require("./middlewares/passport"));
const jwt_strategy_1 = require("./common/strageties/jwt.strategy");
const session_route_1 = __importDefault(require("./modules/session/session.route"));
const mfa_routes_1 = __importDefault(require("./modules/mfa/mfa.routes"));
const user_route_1 = __importDefault(require("./modules/user/user.route"));
const ha_route_1 = __importDefault(require("./modules/ha/ha.route"));
require("./common/scheduler/endLeaveScheduler");
require("./common/scheduler/haScheduler");
require("./common/scheduler/notifcationScheduler");
const feed_route_1 = __importDefault(require("./modules/feed/feed.route"));
const inventory_route_1 = __importDefault(require("./modules/inventory/inventory.route"));
const illness_route_1 = __importDefault(require("./modules/illness/illness.route"));
const treatment_route_1 = __importDefault(require("./modules/treatment/treatment.route"));
const staff_route_1 = __importDefault(require("./modules/staffFamily/staff.route"));
const ha_dashboard_route_1 = __importDefault(require("./modules/ha_dashboard/ha_dashboard.route"));
const illnessCategory_route_1 = __importDefault(require("./modules/illness_category/illnessCategory.route"));
const mentalCases_route_1 = __importDefault(require("./modules/mental_cases/mentalCases.route"));
const notification_route_1 = __importDefault(require("./modules/notification/notification.route"));
const socket_manager_1 = require("./common/service/socket.manager");
const http_1 = __importDefault(require("http"));
const app = (0, express_1.default)();
const BASE_PATH = app_config_1.config.BASE_PATH;
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)({
    origin: app_config_1.config.APP_ORIGIN,
    credentials: true
}));
app.use((0, helmet_1.default)());
app.use((0, cookie_parser_1.default)());
app.use(passport_1.default.initialize());
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)("combined"));
app.get("/", (0, asyncHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "BasePoint",
    });
})));
app.use(`${BASE_PATH}/auth`, auth_route_1.default);
app.use(`${BASE_PATH}/session`, jwt_strategy_1.authenticateJWT, session_route_1.default);
app.use(`${BASE_PATH}/mfa`, mfa_routes_1.default);
app.use(`${BASE_PATH}/user`, user_route_1.default);
app.use(`${BASE_PATH}/ha`, ha_route_1.default);
app.use(`${BASE_PATH}/feed`, feed_route_1.default);
app.use(`${BASE_PATH}/inventory`, inventory_route_1.default);
app.use(`${BASE_PATH}/illness`, illness_route_1.default);
app.use(`${BASE_PATH}/treatment`, treatment_route_1.default);
app.use(`${BASE_PATH}/staffFamily`, staff_route_1.default);
app.use(`${BASE_PATH}/dashboard`, ha_dashboard_route_1.default);
app.use(`${BASE_PATH}/illnessCategory`, illnessCategory_route_1.default);
app.use(`${BASE_PATH}/importantCases`, mentalCases_route_1.default);
app.use(`${BASE_PATH}/notifications`, notification_route_1.default);
app.use(errorHandler_1.errorHandler);
const server = http_1.default.createServer(app);
(0, socket_manager_1.initSocket)(server);
server.listen(app_config_1.config.PORT, () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Server is running on port ${app_config_1.config.PORT}`);
}));
