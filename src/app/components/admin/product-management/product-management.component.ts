import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProductService } from '../../../services/product.service';
import { Product, Categoria } from '../../../interfaces/product.interface';

@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-management.component.html',
  styleUrls: ['./product-management.component.css']
})
export class ProductManagementComponent implements OnInit {
  products: Product[] = [];
  categorias: Categoria[] = [];
  productForm: FormGroup;
  isEditing = false;
  selectedProduct: Product | null = null;
  showForm = false;
  loading = false;
  actionLoading = false;

  // Materiales y colores predefinidos
  materiales: string[] = ['Madera', 'Metal', 'Plástico', 'Vidrio', 'Tela', 'Cuero', 'Cerámica', 'Piedra'];
  colores: string[] = ['Rojo', 'Azul', 'Verde', 'Amarillo', 'Negro', 'Blanco', 'Gris', 'Marrón', 'Beige', 'Naranja', 'Rosa', 'Morado'];

  constructor(
    @Inject(ProductService) private productService: ProductService,
    private formBuilder: FormBuilder
  ) {
    this.productForm = this.formBuilder.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      categoriaId: ['', Validators.required],
      material: ['', Validators.required],
      color: ['', Validators.required],
      dimensiones: ['', Validators.required],
      imagen: [''],
      precio: ['', [Validators.required, Validators.min(0)]],
      precioOferta: [''],
      cantidad: ['', [Validators.required, Validators.min(0)]],
      minimo: ['', [Validators.required, Validators.min(0)]],
      ubicacion: ['Almacén Principal', Validators.required]
    });
  }

  ngOnInit() {
    this.loadProducts();
    this.loadCategorias();
  }

  loadProducts() {
    this.loading = true;
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products.filter(p => p.activo);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando productos:', error);
        this.loading = false;
      }
    });
  }

  loadCategorias() {
    this.productService.getCategorias().subscribe({
      next: (categorias) => {
        this.categorias = categorias.filter(c => c.activo);
      },
      error: (error) => {
        console.error('Error cargando categorías:', error);
      }
    });
  }

  onSubmit() {
    if (this.productForm.valid) {
      this.actionLoading = true;
      const productData: Product = {
        ...this.productForm.value,
        precio: Number(this.productForm.value.precio),
        precioOferta: this.productForm.value.precioOferta ? Number(this.productForm.value.precioOferta) : null,
        cantidad: Number(this.productForm.value.cantidad),
        minimo: Number(this.productForm.value.minimo),
        activo: true
      };

      if (this.isEditing && this.selectedProduct) {
        this.updateProduct(productData);
      } else {
        this.createProduct(productData);
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  createProduct(productData: Product) {
    this.productService.createProduct(productData).subscribe({
      next: (newProduct) => {
        this.products.push(newProduct);
        this.resetForm();
        this.actionLoading = false;
      },
      error: (error) => {
        console.error('Error creando producto:', error);
        this.actionLoading = false;
      }
    });
  }

  updateProduct(productData: Product) {
    if (!this.selectedProduct?.id) return;

    this.productService.updateProduct(this.selectedProduct.id, productData).subscribe({
      next: (updatedProduct) => {
        const index = this.products.findIndex(p => p.id === this.selectedProduct?.id);
        if (index !== -1) {
          this.products[index] = updatedProduct;
        }
        this.resetForm();
        this.actionLoading = false;
      },
      error: (error) => {
        console.error('Error actualizando producto:', error);
        this.actionLoading = false;
      }
    });
  }

  editProduct(product: Product) {
    this.isEditing = true;
    this.selectedProduct = product;
    this.showForm = true;
    
    this.productForm.patchValue({
      nombre: product.nombre,
      descripcion: product.descripcion,
      categoriaId: product.categoriaId,
      material: product.material,
      color: product.color,
      dimensiones: product.dimensiones,
      imagen: product.imagen || '',
      precio: product.precio || 0,
      precioOferta: product.precioOferta || '',
      cantidad: product.cantidad || 0,
      minimo: product.minimo || 5,
      ubicacion: product.ubicacion || 'Almacén Principal'
    });
  }

  deleteProduct(product: Product) {
    if (confirm(`¿Estás seguro de eliminar el producto "${product.nombre}"?`)) {
      this.actionLoading = true;
      this.productService.deleteProduct(product.id!).subscribe({
        next: () => {
          this.products = this.products.filter(p => p.id !== product.id);
          this.actionLoading = false;
        },
        error: (error) => {
          console.error('Error eliminando producto:', error);
          this.actionLoading = false;
        }
      });
    }
  }

  toggleProductStatus(product: Product) {
    this.actionLoading = true;
    const updatedProduct = { ...product, activo: !product.activo };

    this.productService.updateProduct(product.id!, updatedProduct).subscribe({
      next: (result) => {
        const index = this.products.findIndex(p => p.id === product.id);
        if (index !== -1) {
          this.products[index] = result;
        }
        this.actionLoading = false;
      },
      error: (error) => {
        console.error('Error actualizando estado:', error);
        this.actionLoading = false;
      }
    });
  }

  resetForm() {
    this.productForm.reset({
      minimo: 5,
      ubicacion: 'Almacén Principal',
      precio: 0,
      cantidad: 0
    });
    this.isEditing = false;
    this.selectedProduct = null;
    this.showForm = false;
    this.actionLoading = false;
  }

  private markFormGroupTouched() {
    Object.keys(this.productForm.controls).forEach(key => {
      this.productForm.get(key)?.markAsTouched();
    });
  }
  

  getStockBadgeClass(cantidad: number | undefined, minimo: number | undefined): string {
    const stock = cantidad || 0;
    const minStock = minimo || 5;
    
    if (stock < 3) return 'bg-danger';
    if (stock <= minStock) return 'bg-warning';
    return 'bg-success';
  }

  formatCurrency(amount: number | undefined): string {
    if (amount === undefined) return '$0.00';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  }

  // GETTERS COMPLETOS PARA EL FORMULARIO
  get nombre() { return this.productForm.get('nombre'); }
  get descripcion() { return this.productForm.get('descripcion'); }
  get precio() { return this.productForm.get('precio'); }
  get cantidad() { return this.productForm.get('cantidad'); }
  get categoriaId() { return this.productForm.get('categoriaId'); }
  get material() { return this.productForm.get('material'); }
  get color() { return this.productForm.get('color'); }
  get dimensiones() { return this.productForm.get('dimensiones'); }
  get ubicacion() { return this.productForm.get('ubicacion'); }
  get minimo() { return this.productForm.get('minimo'); } // ← GETTER FALTANTE AÑADIDO
  get precioOferta() { return this.productForm.get('precioOferta'); } // ← GETTER FALTANTE AÑADIDO
  get imagen() { return this.productForm.get('imagen'); } // ← GETTER FALTANTE AÑADIDO
}