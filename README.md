# k6 Akıllı Test Otomasyon Platformu (Backend)

Bu proje, `k6` yük testlerini **dinamik olarak oluşturmak, otomatikleştirmek ve raporlamak** için geliştirilmiş bir web platformunun backend motorudur.

Projenin kalbi, bir "Senaryo Kütüphanesi" mimarisine dayanır. Kullanıcılar, "User Login" veya "Add to Cart" gibi önceden tanımlanmış test parçacıklarını seçer; backend "işçisi" (worker) bu parçacıkları kullanıcının girdiği `options` (VU, süre vb.) ayarlarıyla birleştirerek anlık olarak tam bir `k6` test script'i oluşturur ve çalıştırır.

## 🚀 Projenin Güncel Durumu: Backend Tamamlandı!

Projenin backend fazı (motor) %100 tamamlanmıştır ve frontend (kokpit) geliştirilmesine hazırdır.

- **Mimari:** "Akıllı Senaryo Birleştirici" (Mimari D)
- **Altyapı:** Docker (PostgreSQL, Redis)
- **API:** NestJS (TypeScript)
- **Veritabanı:** Prisma ORM
- **Kuyruk/İşçi:** BullMQ

### Tamamlanan Özellikler

- **Docker Altyapısı:** `docker compose up` ile tüm servisler (Postgres, Redis) başlar.
- **API Modülleri:** `Projects`, `Tests` ve `Scenarios` için tam CRUD API'leri.
- **Senaryo Kütüphanesi:** `POST /scenarios` ile veritabanına "test parçacıkları" (`scriptFragment`) eklenebilir.
- **Dinamik Test Oluşturma:** `POST /tests` API'si, seçilen senaryo ID'lerini ve `options` JSON'unu alarak yeni bir test kaydı oluşturur.
- **Dinamik URL:** Test oluştururken `targetBaseUrl` belirterek herhangi bir sitenin hedeflenmesi sağlanır.
- **Asenkron "İşçi" (Worker):** `POST /tests/:id/run` ile tetiklenen testler anında kuyruğa (`BullMQ`) atılır.
- **Akıllı Script Birleştirici:** `TestRunnerProcessor` (işçi), veritabanından `scriptFragment`'ları ve `options`'ı okur, bunları birleştirerek tam bir `k6` script'i oluşturur.
- **Raporlama:** `k6` testi çalışır (`execa`), `resultSummary` (JSON) sonucu okunur ve `TestRun` tablosuna kaydedilir.

---

## 🛠️ Kullanılan Ana Teknolojiler

- **Backend:** [NestJS](https://nestjs.com/) (TypeScript)
- **Veritabanı:** [PostgreSQL](https://www.postgresql.org/)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Kuyruk Sistemi:** [Redis](https://redis.io/) & [BullMQ](https://bullmq.io/)
- **Altyapı:** [Docker](https://www.docker.com/) & Docker Compose
- **Komut Çalıştırma:** [Execa](https://github.com/sindresorhus/execa)

## ⚡ Projeyi Yerel (Local) Ortamda Çalıştırma

### Gereksinimler

- [Node.js](https://nodejs.org/) (v18+)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [k6](https://k6.io/docs/getting-started/installation/) (Bilgisayarda global olarak yüklü olmalı)

### Kurulum Adımları

1.  **Altyapı Servislerini Başlatın (Docker):**
    Projenin ana dizinindeyken:

    ```bash
    docker compose up -d
    ```

2.  **Backend Kurulumu:**

    ```bash
    cd backend
    npm install
    ```

3.  **Veritabanı Senkronizasyonu (Migration):**
    Veritabanını en son şemaya (Senaryo Kütüphanesi ile) sıfırlayın ve kurun:

    ```bash
    npx prisma migrate reset
    ```

4.  **Backend Sunucusunu Başlatın:**
    ```bash
    npm run start:dev
    ```
    Sunucu `http://localhost:3000` adresinde çalışıyor.

### Kütüphaneyi Doldurma (Örnek)

Platformu test etmek için kütüphaneye senaryolar ekleyin (Thunder Client ile):

- **`POST http://localhost:3000/scenarios`**
- **Body (JSON):**
  ```json
  {
    "name": "Browse Homepage",
    "description": "Visits the main page (BASE_URL + '/')",
    "scriptFragment": "export function Browse_Homepage() {\n  http.get(`${BASE_URL}/`); \n  sleep(1);\n}"
  }
  ```
