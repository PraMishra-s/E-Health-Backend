import { MFAController } from "./mfa.controller";
import { MFAService } from "./mfa.service";

const mfaService = new MFAService()
const mfaController = new MFAController(mfaService);

export {mfaService, mfaController}