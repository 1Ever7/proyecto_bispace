# sabi-api

**Descripción:** Sistema de Gestión de Activos y Usuarios de la Empresa

**URL Base:** https://sabi.bispace.site/api

## USR

### GET /usr

Gestión de usuarios del sistema

**Parámetros:**

| Nombre | Tipo | Requerido | Descripción |
|--------|------|-----------|-------------|
| estado | string | No | Filtrar por estado (activo/inactivo) |

---

## ACTIVO

### GET /activo

Lista de activos de la empresa

**Parámetros:**

| Nombre | Tipo | Requerido | Descripción |
|--------|------|-----------|-------------|
| categoria | string | No | Filtrar por categoría de activo |

---

## ACT_ALTA

### GET /act_alta

Registro de altas de activos

---

## AMBIENTE

### GET /ambiente

Gestión de ambientes/locations

---

## BACKUP

### GET /backup

Sistema de backups

---

## BAJA

### GET /baja

Registro de bajas de activos

---

## CANTIDAD

### GET /cantidad

Consultas de cantidad y estadísticas

**Parámetros:**

| Nombre | Tipo | Requerido | Descripción |
|--------|------|-----------|-------------|
| tipo | string | Sí | Tipo de consulta (usuarios, activos, etc.) |

---

## CONDICION

### GET /condicion

Estados y condiciones de activos

---

## DEPRECIACION

### GET /depreciacion

Cálculos de depreciación

---

## DEVOLUCION

### GET /devolucion

Sistema de devoluciones

---

## EDIFICIO

### GET /edificio

Gestión de edificios

---

## FUNCIONARIO

### GET /funcionario

Información de funcionarios

---

## HISTORIAL

### GET /historial

Historial de cambios y movimientos

---

## MANTENIMIENTO

### GET /mantenimiento

Registro de mantenimientos

---

## PROGRAMA

### GET /programa

Programas y proyectos

---

## PROVEEDOR

### GET /proveedor

Gestión de proveedores

---

## PROYECTO

### GET /proyecto

Proyectos de la empresa

---

## REVALORIZACION

### GET /revalorizacion

Revalorizaciones de activos

---

## RUBRO

### GET /rubro

Rubros y categorías

---

## TIPOACTIVO

### GET /tipoactivo

Tipos de activos

---

## UBICACION

### GET /ubicacion

Ubicaciones físicas

---

## GENERARQR

### GET /generarQR

Generación de códigos QR

**Parámetros:**

| Nombre | Tipo | Requerido | Descripción |
|--------|------|-----------|-------------|
| id | string | Sí | ID del elemento para generar QR |

---

