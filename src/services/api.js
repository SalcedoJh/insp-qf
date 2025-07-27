
// src/services/api.js
class ApiService {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.endpoints = {
      reportes: '/reportes',
      estados: '/estados'
    };
  }

  // Método genérico para hacer peticiones HTTP
  async request(url, options = {}) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(`${this.baseUrl}${url}`, config);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Obtener todos los reportes
  async getReportes() {
    try {
      const data = await this.request(this.endpoints.reportes);
      return data.reportes || data; // Maneja tanto { reportes: [...] } como [...]
    } catch (error) {
      console.error('Error fetching reportes:', error);
      // Fallback a datos locales en caso de error
      return this.getFallbackData();
    }
  }

  // Obtener un reporte específico por ID
  async getReporte(id) {
    try {
      const reportes = await this.getReportes();
      return reportes.find(reporte => reporte.id === id);
    } catch (error) {
      console.error('Error fetching reporte:', error);
      return null;
    }
  }

  // Crear un nuevo reporte
  async createReporte(reporteData) {
    try {
      return await this.request(this.endpoints.reportes, {
        method: 'POST',
        body: JSON.stringify(reporteData)
      });
    } catch (error) {
      console.error('Error creating reporte:', error);
      throw error;
    }
  }

  // Actualizar un reporte existente
  async updateReporte(id, reporteData) {
    try {
      return await this.request(`${this.endpoints.reportes}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(reporteData)
      });
    } catch (error) {
      console.error('Error updating reporte:', error);
      throw error;
    }
  }

  // Eliminar un reporte
  async deleteReporte(id) {
    try {
      return await this.request(`${this.endpoints.reportes}/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting reporte:', error);
      throw error;
    }
  }

  // Obtener estados disponibles
  async getEstados() {
    try {
      const data = await this.request(this.endpoints.estados);
      return data.estados || data;
    } catch (error) {
      console.error('Error fetching estados:', error);
      return {
        aprobado: { descripcion: "Aprobado", color: "#28a745" },
        rechazado: { descripcion: "Rechazado", color: "#dc3545" },
        pendiente: { descripcion: "Pendiente", color: "#ffc107" }
      };
    }
  }

  // Filtrar reportes por estado
  async getReportesByEstado(estado) {
    try {
      const reportes = await this.getReportes();
      if (estado === 'all') return reportes;
      return reportes.filter(reporte => reporte.estado === estado);
    } catch (error) {
      console.error('Error filtering reportes:', error);
      return [];
    }
  }

  // Formatear datos para el historial
  formatReportesForHistory(reportes) {
    return reportes.map(reporte => ({
      id: reporte.id,
      date: reporte.elaboracion.fecha_elaboracion || reporte.datos_inspeccion.fecha,
      product: reporte.datos_inspeccion.producto || 'Producto no especificado',
      lot: reporte.datos_inspeccion.lote || 'Lote no especificado',
      status: reporte.estado,
      area: reporte.datos_inspeccion.area || 'Área no especificada',
      elaborado_por: reporte.elaboracion.elaborado_por,
      total_defectos: typeof reporte.defectos?.total_general === 'number'
        ? reporte.defectos.total_general
        : 0,
      completado: reporte.metadata.completado
    }));
  }

  // Datos de respaldo en caso de que falle la conexión
  getFallbackData() {
    return [
      {
        id: "INS-2025-001",
        estado: "aprobado",
        metadata: {
          completado: true
        },
        elaboracion: {
          elaborado_por: "María González",
          fecha_elaboracion: "2025-07-15"
        },
        datos_inspeccion: {
          area: "Área de Producción",
          producto: "Producto B - Categoría 2",
          lote: "PRD-789"
        },
        defectos: {
          total_general: 0
        }
      },
      {
        id: "INS-2025-002",
        estado: "rechazado",
        metadata: {
          completado: true
        },
        elaboracion: {
          elaborado_por: "Juan Pérez",
          fecha_elaboracion: "2025-07-18"
        },
        datos_inspeccion: {
          area: "Área de Empaque",
          producto: "Producto C - Categoría 3",
          lote: "EMP-456"
        },
        defectos: {
          total_general: 10
        }
      },
      {
        id: "INS-2025-003",
        estado: "pendiente",
        metadata: {
          completado: false
        },
        elaboracion: {
          elaborado_por: "Luisa Ramírez",
          fecha_elaboracion: "2025-07-20"
        },
        datos_inspeccion: {
          area: "Área de Almacén",
          producto: "",
          lote: ""
        },
        defectos: {
          total_general: null
        }
      }
    ];
  }

  // Método para simular carga desde JSON local (para desarrollo)
  async loadFromLocalJson() {
    try {
      // Si tienes el archivo db.json en public/data/db.json
      const response = await fetch('/data/db.json');
      const data = await response.json();
      return data.reportes;
    } catch (error) {
      console.warn('No se pudo cargar db.json local, usando datos de respaldo');
      return this.getFallbackData();
    }
  }
}

// Crear una instancia singleton
const apiService = new ApiService();

export default apiService;