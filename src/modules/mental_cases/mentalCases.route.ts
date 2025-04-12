import { Router } from 'express';
import { authenticateJWT } from '../../common/strageties/jwt.strategy';
import { mentalController } from './mentalCase.module';


const Mentalroute = Router();

Mentalroute.get('/', authenticateJWT, mentalController.getAllCases);
Mentalroute.put('/update/:id', authenticateJWT, mentalController.updateCase);

export default Mentalroute;