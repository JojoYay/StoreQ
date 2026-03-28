export class NextRequest {
  private _body: string;
  readonly method: string;
  readonly url: string;

  constructor(url: string, init?: { method?: string; body?: string; headers?: Record<string, string> }) {
    this.url = url;
    this.method = init?.method ?? "GET";
    this._body = init?.body ?? "";
  }

  async json() {
    return JSON.parse(this._body);
  }
}

export class NextResponse {
  readonly status: number;
  private _body: string;

  constructor(body: string, init?: { status?: number }) {
    this._body = body;
    this.status = init?.status ?? 200;
  }

  async json() {
    return JSON.parse(this._body);
  }

  static json(data: unknown, init?: { status?: number }) {
    return new NextResponse(JSON.stringify(data), init);
  }
}
