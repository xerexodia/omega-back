import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class ScopesGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isAuthenticated = (await super.canActivate(context)) as boolean;
    if (!isAuthenticated) {
      return false;
    }

    const requiredScopes = this.reflector.get<string[]>(
      'scopes',
      context.getHandler(),
    );
    if (!requiredScopes || requiredScopes.length === 0) {
      return true;
    }
    
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (requiredScopes.includes('admin') && user.email.includes('admin')) {
      return true;
    }

    return false;
  }
}
