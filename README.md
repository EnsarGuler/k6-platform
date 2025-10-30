k6 Yük Testi Yönetim Platformu
Bu proje, k6 yük testlerini yönetmek, otomatikleştirmek ve sonuçlarını analiz etmek için geliştirilmiş bir web tabanlı yönetim platformudur.

Proje, bir NestJS backend API'si ve (gelecekte eklenecek) bir Next.js frontend'den oluşmaktadır. Tüm altyapı servisleri (veritabanı, kuyruk) Docker ile yönetilmektedir.

🚀 Projenin Güncel Durumu (Work In Progress)
Proje şu anda Faz 2 geliştirme aşamasındadır. Backend API'si başarıyla tamamlanmıştır.

Tamamlananlar:

Project (Proje) ve Test (Test Senaryosu) oluşturmak için gerekli API endpoint'leri (/projects, /tests) tamamlandı.

Bir testi çalıştırmak (/tests/:id/run) ve asenkron olarak kuyruğa (Redis/BullMQ) atmak için gerekli API altyapısı tamamlandı.

Tüm altyapı (PostgreSQL, Redis) Docker Compose ile tam otomatize edildi.

Sıradaki Adım (Adım 12):

Kuyruğa atılan test işlerini dinleyecek ve k6 komutlarını fiilen çalıştıracak olan Worker (İşçi) Processor'ünün geliştirilmesi.

🛠️ Kullanılan Teknolojiler
Backend: NestJS (TypeScript)

Veritabanı: PostgreSQL

ORM: Prisma (
