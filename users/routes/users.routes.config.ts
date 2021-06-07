import { CommonRoutesConfig } from '../../common/routes/common.routes.config';
import UsersController from '../controllers/users.controller';
import UsersMiddleware from '../middleware/users.middleware';
import jwtMiddleware from '../../auth/middleware/jwt.middleware';
import permissionMiddleware from '../../common/middleware/common.permission.middleware';
import { PermissionFlag } from '../../common/middleware/common.permissionflag.enum';
import express from 'express';
import BodyValidationMiddleware from '../../common/middleware/body.validation.middleware';
import { body } from 'express-validator';

export class UsersRoutesConfig extends CommonRoutesConfig {
  constructor(app: express.Application) {
    super(app, 'UsersRoutesConfig');
  }
  configureRoutes() {
    this.app
      .route(`/users`)
      .get(UsersController.listUsers)
      .post(
        body('email').isEmail(),
        body('password')
          .isLength({ min: 5 })
          .withMessage('Must include password (5+ characters)'),
        BodyValidationMiddleware.verifyBodyFieldsErrors,
        UsersMiddleware.validateSameEmailDoesntExist,
        UsersController.createUser
      );
    
    this.app.param(`userId`, UsersMiddleware.extractUserId);
    this.app
      .route(`/users/:userId`)
      .all(UsersMiddleware.validateUserExists)
      .get(UsersController.getUserById)
      .delete(UsersController.removeUser);    
    
    this.app.put(`/users/:userId`, [
      body('email').isEmail(),
      body('password')
        .isLength({ min: 5 })
        .withMessage('Must include password (5+ characters)'),
      body('firstName').isString(),
      body('lastName').isString(),
      body('permissionFlags').isInt(),
      BodyValidationMiddleware.verifyBodyFieldsErrors,      
      UsersMiddleware.validateSameEmailBelongToSameUser,
      UsersController.put,
    ]);
    
    this.app.patch(`/users/:userId`, [
      body('email').isEmail().optional(),
      body('password')
        .isLength({ min: 5 })
        .withMessage('Password must be 5+ characters')
        .optional(),
      body('firstName').isString().optional(),
      body('lastName').isString().optional(),
      body('permissionFlags').isInt().optional(),
      BodyValidationMiddleware.verifyBodyFieldsErrors,      
      UsersMiddleware.validatePatchEmail,
      UsersController.patch,
    ]);      
    
    this.app.put(`/users/:userId/permissionFlags/:permissionFlags`, [
      jwtMiddleware.validJWTNeeded,
      permissionMiddleware.onlySameUserOrAdminCanDoThisAction,
  
      // Note: The above two pieces of middleware are needed despite
      // the reference to them in the .all() call, because that only covers
      // /users/:userId, not anything beneath it in the hierarchy
  
      permissionMiddleware.permissionFlagRequired(
          PermissionFlag.FREE_PERMISSION
      ),
      UsersController.updatePermissionFlags,
  ]);    
    return this.app;
  }
}