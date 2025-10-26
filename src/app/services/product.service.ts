import { Injectable } from '@angular/core';
import { Observable, map, forkJoin, switchMap } from 'rxjs';
import { ApiService } from './api.service';
import { Product, Categoria, Precio, Stock } from '../interfaces/product.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(private apiService: ApiService) { }

  // Obtener todos los productos con sus relaciones
  getProducts(): Observable<Product[]> {
    return forkJoin({
      productos: this.apiService.get<any[]>('productos'),
      precios: this.apiService.get<any[]>('precios'),
      stocks: this.apiService.get<any[]>('stocks'),
      categorias: this.apiService.get<any[]>('categorias')
    }).pipe(
      map(({ productos, precios, stocks, categorias }) => {
        return productos.map(producto => {
          // Encontrar precio del producto
          const precioProducto = precios.find(p => p.productoId === producto.id && p.activo);
          // Encontrar stock del producto
          const stockProducto = stocks.find(s => s.productoId === producto.id && s.activo);
          // Encontrar categoría
          const categoriaProducto = categorias.find(c => c.id === producto.categoriaId);

          return {
            id: producto.id,
            nombre: producto.nombre,
            descripcion: producto.descripcion,
            categoriaId: producto.categoriaId,
            material: producto.material,
            color: producto.color,
            dimensiones: producto.dimensiones,
            imagen: producto.imagen,
            activo: producto.activo,
            fechaCreacion: new Date(producto.fechaCreacion),
            
            // Propiedades relacionadas
            precio: precioProducto?.precio || 0,
            precioOferta: precioProducto?.precioOferta || null,
            cantidad: stockProducto?.cantidad || 0,
            minimo: stockProducto?.minimo || 0,
            ubicacion: stockProducto?.ubicacion || '',
            categoriaNombre: categoriaProducto?.nombre || 'Sin categoría'
          };
        });
      })
    );
  }

  // Crear producto (crea producto, precio y stock)
  createProduct(product: Product): Observable<Product> {
    // Primero crear el producto
    return this.apiService.post<any>('productos', {
      nombre: product.nombre,
      descripcion: product.descripcion,
      categoriaId: product.categoriaId,
      material: product.material,
      color: product.color,
      dimensiones: product.dimensiones,
      imagen: product.imagen,
      activo: true,
      fechaCreacion: new Date().toISOString()
    }).pipe(
      switchMap(newProduct => {
        // Luego crear el precio
        const precioRequest = this.apiService.post<any>('precios', {
          productoId: newProduct.id,
          precio: product.precio || 0,
          precioOferta: product.precioOferta, // ← Corregido: puede ser null
          moneda: "ARS",
          activo: true,
          fechaCreacion: new Date().toISOString()
        });

        // Y crear el stock
        const stockRequest = this.apiService.post<any>('stocks', {
          productoId: newProduct.id,
          cantidad: product.cantidad || 0,
          minimo: product.minimo || 5, // stock mínimo por defecto
          ubicacion: product.ubicacion || 'Almacén Principal',
          activo: true,
          fechaCreacion: new Date().toISOString()
        });

        return forkJoin([precioRequest, stockRequest]).pipe(
          map(([precio, stock]) => ({
            ...newProduct,
            precio: precio.precio,
            precioOferta: precio.precioOferta,
            cantidad: stock.cantidad,
            minimo: stock.minimo,
            ubicacion: stock.ubicacion,
            fechaCreacion: new Date(newProduct.fechaCreacion)
          }))
        );
      })
    );
  }

  // Actualizar producto
  updateProduct(id: string, product: Product): Observable<Product> {
    // Actualizar producto
    return this.apiService.put<any>(`productos/${id}`, {
      nombre: product.nombre,
      descripcion: product.descripcion,
      categoriaId: product.categoriaId,
      material: product.material,
      color: product.color,
      dimensiones: product.dimensiones,
      imagen: product.imagen,
      activo: product.activo
    }).pipe(
      switchMap(updatedProduct => {
        // También actualizar precio si cambió
        if (product.precio !== undefined) {
          this.updateProductPrice(id, product.precio, product.precioOferta || null).subscribe(); // ← Corregido
        }
        // Y actualizar stock si cambió
        if (product.cantidad !== undefined) {
          this.updateProductStock(
            id, 
            product.cantidad, 
            product.minimo || 5, 
            product.ubicacion || 'Almacén Principal'
          ).subscribe();
        }

        return this.getProductById(id);
      })
    );
  }

  // Métodos auxiliares para actualizar precio y stock
  private updateProductPrice(productoId: string, precio: number, precioOferta: number | null): Observable<any> {
    // Primero desactivar precios antiguos
    return this.apiService.get<any[]>(`precios?productoId=${productoId}`).pipe(
      switchMap(precios => {
        const updateRequests = precios
          .filter(p => p.activo)
          .map(p => this.apiService.put<any>(`precios/${p.id}`, { ...p, activo: false }));

        return forkJoin(updateRequests).pipe(
          switchMap(() => {
            // Crear nuevo precio activo
            return this.apiService.post<any>('precios', {
              productoId: productoId,
              precio: precio,
              precioOferta: precioOferta, // ← Ya es number | null
              moneda: "ARS",
              activo: true,
              fechaCreacion: new Date().toISOString()
            });
          })
        );
      })
    );
  }

  private updateProductStock(productoId: string, cantidad: number, minimo: number, ubicacion: string): Observable<any> {
    // Similar lógica para stock
    return this.apiService.get<any[]>(`stocks?productoId=${productoId}`).pipe(
      switchMap(stocks => {
        const updateRequests = stocks
          .filter(s => s.activo)
          .map(s => this.apiService.put<any>(`stocks/${s.id}`, { ...s, activo: false }));

        return forkJoin(updateRequests).pipe(
          switchMap(() => {
            // Crear nuevo stock activo
            return this.apiService.post<any>('stocks', {
              productoId: productoId,
              cantidad: cantidad,
              minimo: minimo,
              ubicacion: ubicacion,
              activo: true,
              fechaCreacion: new Date().toISOString()
            });
          })
        );
      })
    );
  }

  // Obtener producto por ID
  getProductById(id: string): Observable<Product> {
    return forkJoin({
      producto: this.apiService.get<any>(`productos/${id}`),
      precios: this.apiService.get<any[]>(`precios?productoId=${id}`),
      stocks: this.apiService.get<any[]>(`stocks?productoId=${id}`),
      categorias: this.apiService.get<any[]>('categorias')
    }).pipe(
      map(({ producto, precios, stocks, categorias }) => {
        const precioActivo = precios.find(p => p.activo);
        const stockActivo = stocks.find(s => s.activo);
        const categoria = categorias.find(c => c.id === producto.categoriaId);

        return {
          id: producto.id,
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          categoriaId: producto.categoriaId,
          material: producto.material,
          color: producto.color,
          dimensiones: producto.dimensiones,
          imagen: producto.imagen,
          activo: producto.activo,
          fechaCreacion: new Date(producto.fechaCreacion),
          
          precio: precioActivo?.precio || 0,
          precioOferta: precioActivo?.precioOferta || null,
          cantidad: stockActivo?.cantidad || 0,
          minimo: stockActivo?.minimo || 0,
          ubicacion: stockActivo?.ubicacion || '',
          categoriaNombre: categoria?.nombre || 'Sin categoría'
        };
      })
    );
  }

  // Eliminar producto (soft delete)
  deleteProduct(id: string): Observable<any> {
    return this.apiService.put<any>(`productos/${id}`, { activo: false });
  }

  // Obtener categorías
  getCategorias(): Observable<Categoria[]> {
    return this.apiService.get<any[]>('categorias').pipe(
      map(categorias => categorias.map(cat => ({
        id: cat.id,
        nombre: cat.nombre,
        descripcion: cat.descripcion,
        imagen: cat.imagen,
        activo: cat.activo,
        fechaCreacion: new Date(cat.fechaCreacion)
      })))
    );
  }
}