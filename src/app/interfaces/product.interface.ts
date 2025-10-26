export interface Product {
  id?: string;
  nombre: string;           // ← en español
  descripcion: string;      // ← en español
  categoriaId: string;      // ← en español
  material: string;         // ← nueva propiedad
  color: string;           // ← nueva propiedad
  dimensiones: string;     // ← nueva propiedad
  imagen: string;          // ← en español (era imageUrl)
  activo: boolean;         // ← en español (era isActive)
  fechaCreacion: Date;     // ← en español (era createdAt)
  
  // Propiedades relacionadas (para joins)
  precio?: number;
  precioOferta?: number | null;
  cantidad?: number;       // stock
  minimo?: number;         // stock mínimo
  ubicacion?: string;      // ubicación del stock
  categoriaNombre?: string; // nombre de la categoría
}

export interface Categoria {
  id?: string;
  nombre: string;
  descripcion: string;
  imagen: string;
  activo: boolean;
  fechaCreacion: Date;
}

export interface Precio {
  id?: string;
  productoId: string;
  precio: number;
  precioOferta: number | null;
  moneda: "ARS";
  activo: boolean;
  fechaCreacion: Date;
}

export interface Stock {
  id?: string;
  productoId: string;
  cantidad: number;
  minimo: number;
  ubicacion: string;
  activo: boolean;
  fechaCreacion: Date;
}