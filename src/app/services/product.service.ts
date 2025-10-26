import { Injectable } from '@angular/core';
import { Observable, map, forkJoin, switchMap, of } from 'rxjs';
import { ApiService } from './api.service';
import { Product, Categoria, Precio, Stock } from '../interfaces/product.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(private apiService: ApiService) { }

  
  getProducts(): Observable<Product[]> {
    console.log('🛍️ Solicitando productos...');
    
    return this.apiService.get<any[]>('productos').pipe(
      map(productos => {
        console.log('📦 Productos recibidos del backend:', productos);
        
        // El backend devuelve un array directo, no un objeto
        if (!Array.isArray(productos)) {
          console.warn('⚠️ La respuesta no es un array:', productos);
          return [];
        }

        console.log(`📊 ${productos.length} productos encontrados`);

        // Mapear los productos al formato del frontend
        return productos.map((producto: any) => {
          console.log('🔍 Procesando producto:', producto.nombre);
          
          return {
            id: producto.id,
            nombre: producto.nombre,
            descripcion: producto.descripcion,
            categoriaId: producto.categoriaId,
            material: producto.material,
            color: producto.color,
            dimensiones: producto.dimensiones,
            imagen: producto.imagen,
            activo: producto.activo !== undefined ? producto.activo : true,
            fechaCreacion: new Date(producto.fechaCreacion),
            
            // 🆕 CORRECCIÓN: Los datos de precio y stock vienen incluidos en el producto
            precio: producto.precio?.precio || 0,
            precioOferta: producto.precio?.precioOferta || null,
            cantidad: producto.stock?.cantidad || 0,
            minimo: producto.stock?.minimo || 5,
            ubicacion: producto.stock?.ubicacion || 'Almacén Principal',
            categoriaNombre: 'Cargando...' // Se cargará después si es necesario
          };
        });
      })
    );
  }

  // 🆕 VERSIÓN MEJORADA - Obtener productos con categorías
  getProductsWithCategories(): Observable<Product[]> {
    console.log('🛍️ Solicitando productos y categorías...');
    
    return forkJoin({
      productos: this.apiService.get<any[]>('productos'),
      categorias: this.apiService.get<any[]>('categorias')
    }).pipe(
      map(({ productos, categorias }) => {
        console.log('📦 Productos recibidos:', productos);
        console.log('📂 Categorías recibidas:', categorias);
        
        if (!Array.isArray(productos)) {
          console.warn('⚠️ Productos no es array:', productos);
          return [];
        }

        return productos.map((producto: any) => {
          // Encontrar categoría
          const categoriaProducto = Array.isArray(categorias) 
            ? categorias.find(c => c.id === producto.categoriaId)
            : null;

          return {
            id: producto.id,
            nombre: producto.nombre,
            descripcion: producto.descripcion,
            categoriaId: producto.categoriaId,
            material: producto.material,
            color: producto.color,
            dimensiones: producto.dimensiones,
            imagen: producto.imagen,
            activo: producto.activo !== undefined ? producto.activo : true,
            fechaCreacion: new Date(producto.fechaCreacion),
            
            // Datos de relaciones
            precio: producto.precio?.precio || 0,
            precioOferta: producto.precio?.precioOferta || null,
            cantidad: producto.stock?.cantidad || 0,
            minimo: producto.stock?.minimo || 5,
            ubicacion: producto.stock?.ubicacion || 'Almacén Principal',
            categoriaNombre: categoriaProducto?.nombre || 'Sin categoría'
          };
        });
      })
    );
  }

 // Crear producto - VERSIÓN CORREGIDA
createProduct(product: Product): Observable<Product> {
  console.log('📤 Enviando datos para crear producto:', product);
  
  return this.apiService.post<any>('productos', {
    nombre: product.nombre,
    descripcion: product.descripcion,
    categoriaId: product.categoriaId,
    material: product.material,
    color: product.color,
    dimensiones: product.dimensiones,
    imagen: product.imagen,
    precio: product.precio || 0, // 🆕 AGREGAR precio aquí
    cantidadStock: product.cantidad || 0, // 🆕 CAMBIAR cantidad → cantidadStock
    activo: true,
    fechaCreacion: new Date().toISOString()
  }).pipe(
    switchMap(newProduct => {
      console.log('✅ Producto creado, creando precio y stock...');
      
      const precioRequest = this.apiService.post<any>('precios', {
        productoId: newProduct.id,
        precio: product.precio || 0,
        precioOferta: product.precioOferta,
        moneda: "ARS",
        activo: true,
        fechaCreacion: new Date().toISOString()
      });

      const stockRequest = this.apiService.post<any>('stocks', {
        productoId: newProduct.id,
        cantidad: product.cantidad || 0,
        minimo: product.minimo || 5,
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

  // Actualizar producto (simplificado)
  updateProduct(id: string, product: Product): Observable<Product> {
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
        // Actualizaciones de precio y stock opcionales
        const updates = [];
        
        if (product.precio !== undefined) {
          updates.push(this.updateProductPrice(id, product.precio, product.precioOferta || null));
        }
        
        if (product.cantidad !== undefined) {
          updates.push(this.updateProductStock(
            id, 
            product.cantidad, 
            product.minimo || 5, 
            product.ubicacion || 'Almacén Principal'
          ));
        }

        if (updates.length > 0) {
          return forkJoin(updates).pipe(
            map(() => this.mapProductToFrontend(updatedProduct))
          );
        } else {
          return of(this.mapProductToFrontend(updatedProduct));
        }
      })
    );
  }

  // Método auxiliar para mapear producto
  private mapProductToFrontend(producto: any): Product {
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
      precio: producto.precio || 0,
      cantidad: producto.cantidad || 0,
      minimo: producto.minimo || 5,
      ubicacion: producto.ubicacion || 'Almacén Principal'
    };
  }

  // Métodos auxiliares para actualizar precio y stock (mantener igual)
  private updateProductPrice(productoId: string, precio: number, precioOferta: number | null): Observable<any> {
    return this.apiService.get<any[]>(`precios?productoId=${productoId}`).pipe(
      switchMap(precios => {
        const updateRequests = precios
          .filter(p => p.activo)
          .map(p => this.apiService.put<any>(`precios/${p.id}`, { 
            ...p, 
            activo: false 
          }));

        return forkJoin(updateRequests).pipe(
          switchMap(() => {
            return this.apiService.post<any>('precios', {
              productoId: productoId,
              precio: precio,
              precioOferta: precioOferta,
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
    return this.apiService.get<any[]>(`stocks?productoId=${productoId}`).pipe(
      switchMap(stocks => {
        const updateRequests = stocks
          .filter(s => s.activo)
          .map(s => this.apiService.put<any>(`stocks/${s.id}`, { 
            ...s, 
            activo: false 
          }));

        return forkJoin(updateRequests).pipe(
          switchMap(() => {
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

  // Obtener producto por ID (simplificado)
  getProductById(id: string): Observable<Product> {
    return this.apiService.get<any>(`productos/${id}`).pipe(
      map(producto => this.mapProductToFrontend(producto))
    );
  }

  // Eliminar producto (mantener igual)
  deleteProduct(id: string): Observable<any> {
    return this.apiService.put<any>(`productos/${id}`, { activo: false });
  }

  // Obtener categorías (mantener igual)
  getCategorias(): Observable<Categoria[]> {
    return this.apiService.get<any[]>('categorias').pipe(
      map(categorias => {
        if (!Array.isArray(categorias)) return [];
        return categorias.map(cat => ({
          id: cat.id,
          nombre: cat.nombre,
          descripcion: cat.descripcion,
          imagen: cat.imagen,
          activo: cat.activo,
          fechaCreacion: new Date(cat.fechaCreacion)
        }));
      })
    );
  }
}