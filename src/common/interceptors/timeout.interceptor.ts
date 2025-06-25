import { CallHandler, ExecutionContext, Injectable, NestInterceptor, RequestTimeoutException } from "@nestjs/common";
import { Observable, throwError, TimeoutError } from "rxjs";
import { catchError, timeout } from "rxjs/operators";



@Injectable()
export class TimeoutInterceptor implements NestInterceptor {

    constructor(private readonly timeout: number = 10000) {}

    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any>{
        return next.handle().pipe(
            timeout(this.timeout),
            catchError((err) => {
                if (err instanceof TimeoutError) {
                    return throwError(() => new RequestTimeoutException('请求超时'))
                }
                return throwError(() => err)
            })
        )
    }
}