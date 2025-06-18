export class GenericResponse<T> {
  success: boolean;
  message?: string;
  data?: T;

  constructor(params: { success: boolean; message?: string; data?: T }) {
    this.success = params.success;
    this.message = params.message;
    this.data = params.data;
  }
}
