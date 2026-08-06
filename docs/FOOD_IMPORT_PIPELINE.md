# Pipeline alimentar

Arquivos versionados ficam em `data/nutrition/imports`; metadados em `sources`. O formato intermediário `NutritionSourceRow` exige fonte, identificação, referência, acesso, nome, categoria, preparo, base, macros e confiança. Os scripts validam, auditam, calculam SHA-256 e geram relatório idempotente. USDA pode ser previamente baixado e normalizado por FDC ID; API e chave jamais integram frontend, bundle, localStorage ou operação offline.
