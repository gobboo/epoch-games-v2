import { CanActivate, Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { UserService } from "../user/user.service";
import * as jwt from 'jsonwebtoken';

@Injectable()
export class WsGuard implements CanActivate {

  constructor(private userService: UserService) {
  }

  canActivate(
    context: any,
  ): boolean | any | Promise<boolean | any> | Observable<boolean | any> {
    const bearerToken = context.args[0].handshake.headers.authorization;

		try {
			if (!bearerToken) {
				return false;
			}

      const decoded = jwt.verify(bearerToken, process.env.JWT_SECRET) as any;

      return new Promise((resolve, reject) => {
        return this.userService.findByIdentifier('_id', decoded._id).then(user => {
          if (user) {
						context.args[0].user = user;
            resolve(user);
          } else {
            reject(new Error('Invalid token'));
          }
        });

      });
    } catch (ex) {
      console.log(ex);
      return false;
    }
  }
}