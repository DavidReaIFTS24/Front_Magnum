import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Product } from '../interfaces/product.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  constructor(private apiService: ApiService) { }

  getProducts(): Observable<Product[]> {
    return this.apiService.get<Product[]>('products');
  }

  getProductById(id: string): Observable<Product> {
    return this.apiService.get<Product>(`products/${id}`);
  }

  createProduct(product: Product): Observable<Product> {
    return this.apiService.post<Product>('products', product);
  }

  updateProduct(id: string, product: Product): Observable<Product> {
    return this.apiService.put<Product>(`products/${id}`, product);
  }

  deleteProduct(id: string): Observable<any> {
    return this.apiService.delete<any>(`products/${id}`);
  }
}