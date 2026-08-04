import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class MockDataLoader {
  private readonly baseUrl = 'assets/mock-data';

  constructor(private readonly http: HttpClient) {}

  load<T>(fixture: string): Observable<T> {
    const latency = 300 + Math.floor(Math.random() * 200);
    if (this.shouldSimulateError()) {
      return new Observable<T>(subscriber => {
        setTimeout(() => {
          subscriber.error({ status: 500, statusText: 'Internal Server Error', message: `Simulated HTTP error for fixture: ${fixture}` });
        }, latency);
      });
    }
    return this.http.get<T>(`${this.baseUrl}/${fixture}.json`).pipe(delay(latency));
  }

  private shouldSimulateError(): boolean {
    try {
      return new URLSearchParams(window.location.search).get('simulateError') === 'true';
    } catch {
      return false;
    }
  }
}
