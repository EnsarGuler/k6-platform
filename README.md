# k6 Akıllı Test Otomasyon Platformu (Full Stack)

Bu proje, **k6** yük testlerini dinamik olarak oluşturmak, yönetmek, **canlı olarak izlemek** ve raporlamak için geliştirilmiş modern bir web platformudur.

Proje, güçlü bir **Backend Motoru** (NestJS) ile modern bir **Frontend Kokpiti** (Next.js) birleştirir. Kullanıcılar, arayüz üzerinden "Senaryo Kütüphanesi"ndeki parçacıkları seçer (Örn: "Login", "Add to Cart"), hedef URL'i belirler ve testi başlatır. Sistem, bu parçaları birleştirip anlık olarak k6 script'i üretir, çalıştırır ve sonuçları **WebSockets üzerinden canlı grafiklerle** ekrana yansıtır.

## 🚀 Projenin Güncel Durumu: Full Stack Tamamlandı\!

Projenin Backend (Motor) ve Frontend (Kokpit) geliştirmeleri tamamlanmış, **Real-time (Gerçek Zamanlı)** izleme özellikleri eklenmiştir.

- **Mimari:** "Akıllı Senaryo Birleştirici" + "Event-Driven WebSocket"
- **Altyapı:** Docker (PostgreSQL, Redis)
- **Backend:** NestJS (TypeScript), Prisma ORM, BullMQ, Socket.io
- **Frontend:** Next.js 14, Tailwind CSS, Shadcn UI, Recharts

## ✨ Temel Özellikler

### 1\. Backend & Altyapı

- **Docker Altyapısı:** `docker compose up` ile Veritabanı ve Kuyruk sistemleri (Redis) ayağa kalkar.
- **Senaryo Kütüphanesi:** Test parçacıklarını (`scriptFragment`) veritabanında saklar ve yönetir.
- **Dinamik Script Motoru:** Seçilen senaryoları ve `options` (VU, Süre) ayarlarını birleştirerek `js` dosyasını on-the-fly (havada) oluşturur.
- **Asenkron İşçi (Worker):** Testleri kuyruğa (BullMQ) alır ve sırasıyla çalıştırır. Sistem yoğunluktan etkilenmez.

### 2\. Frontend & Görselleştirme (YENİ)

- **Modern Kokpit:** Test oluşturma, senaryo seçimi ve konfigürasyon için kullanıcı dostu arayüz.
- **🔴 Canlı (Live) İzleme:** Test çalışırken **WebSocket** üzerinden saniye saniye gecikme (latency) verileri akar ve grafik üzerinde canlı izlenir.
- **📊 Detaylı Raporlama:** Test bittiğinde toplam istek, hata oranı, P95 ve Max süreleri içeren detaylı grafikler sunulur.
- **Hata Analizi:** k6'nın karmaşık JSON çıktılarını analiz eder ve hata oranlarını (%0 - %100) net bir şekilde gösterir.
- **Test Geçmişi:** Geçmiş testleri listeleme, durumlarını (Running/Completed) görme ve silme özelliği.

## 🛠️ Kullanılan Teknolojiler

| Alan            | Teknolojiler                                                                     |
| :-------------- | :------------------------------------------------------------------------------- |
| **Backend**     | NestJS, TypeScript, Prisma ORM, BullMQ, Socket.io (Gateway)                      |
| **Frontend**    | Next.js 14 (App Router), React Query, Recharts (Grafik), Tailwind CSS, Shadcn UI |
| **Veritabanı**  | PostgreSQL                                                                       |
| **Kuyruk**      | Redis                                                                            |
| **Test Motoru** | k6 (Grafana), Execa                                                              |
| **DevOps**      | Docker & Docker Compose                                                          |

## ⚡ Kurulum ve Çalıştırma

Projeyi yerel ortamda çalıştırmak için aşağıdaki adımları izleyin.

### Gereksinimler

- Node.js (v18+)
- Docker Desktop
- k6 (Global olarak yüklü olmalı)

### 1\. Altyapıyı Başlatın (Docker)

Projenin ana dizininde:

```bash
docker compose up -d
```

### 2\. Backend'i Kurun ve Başlatın

```bash
cd backend
npm install
npx prisma migrate reset  # Veritabanını sıfırla ve şemayı kur
npm run start:dev
```

_Backend `http://localhost:3000` adresinde çalışacaktır._

### 3\. Frontend'i Kurun ve Başlatın

Yeni bir terminal açın:

```bash
cd frontend
npm install
npm run dev
```

_Frontend otomatik olarak `http://localhost:3001` adresinde çalışacaktır._

---

## 🎮 Nasıl Test Yapılır?

1.  Tarayıcıda **`http://localhost:3001`** adresine gidin.
2.  **Senaryolar** sayfasından yeni bir test parçacığı ekleyin (Örn: `export function Test() { http.get(BASE_URL); }`).
3.  **Test Oluştur** sayfasına gidin.
4.  Hedef URL'i (Örn: `https://test-api.k6.io`) ve yük ayarlarını (VUs, Süre) girin.
5.  **TESTİ BAŞLAT** butonuna basın.
6.  Aşağıdaki listeden teste tıklayarak **Canlı Grafikleri** izleyin\! 🚀
