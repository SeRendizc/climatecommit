# 香港专营巴士电动化参数依据

这些数据用于购置和运营排放情景。统一比较相同的巴士服务里程，并将资助事实、历史参照和可调整的情景输入分别展示。

| 参数 | 可使用的数值 | 来源与口径 |
| --- | --- | --- |
| 资助规模和额度 | 约 600 辆，预留 HK$470m。每车按合资格购置资本成本的 25% 与单层 HK$400,000 或双层 HK$800,000 上限取低值。 | [2025 年预算案第 180 段](https://www.info.gov.hk/gia/general/202502/26/P2025022600142.htm)、[新能源运输基金计划](https://www.eeb.gov.hk/en/new-energy-transport-fund/AU.html)。[2024 年立法会文件第 7–8 段](https://www.legco.gov.hk/yr2024/english/panels/ea/papers/eatp20241216cb1-1665-1-e.pdf)列明车辆登记后发放 75%，余下 25% 取决于指定表现目标。 |
| 营办商指示性购置价格 | 电动 HK$4.5m，柴油 HK$3.0m。 | [环境及生态局提交立法会的补充资料，第 4 段脚注 1](https://www.legco.gov.hk/yr2024/english/panels/ea/papers/eatp20241216cb1-1225-1-e.pdf#page=2)。2025 年营办商提供的约数，该处未按单层与双层分列。 |
| 按车型拆分的购置和能耗参考 | 单层电动 HK$2.50m、柴油 HK$1.50m，1.35 kWh/km、32 L/100 km。三轴双层电动 HK$4.45m、柴油 HK$2.89m，2.34 kWh/km、39 L/100 km。 | [WRI 与 Civic Exchange 香港道路减碳研究，第 26 页表 12](https://civic-exchange.org/wp-content/uploads/2022/12/HK-transport_Final_20220930.pdf)。表中为 2021 年成本情景输入，适合做模型参照。 |
| 双层电动车耗电实证参考 | 1.770 kWh/km。 | [Zhao 等，双层纯电与氢燃料电池巴士能耗，2026 年](https://ira.lib.polyu.edu.hk/handle/10397/120189?mode=full)。使用真实运营数据建模得到的特定双层车研究结果。充电端损耗可用单独的情景效率表达。 |
| 单层电动车试验参考 | 1.27–1.86 kWh/km。 | [2020–21 财政预算答复，表 2](https://www.eeb.gov.hk/sites/default/files/en/node5265/fcq_20-21e.pdf)。香港专营巴士试验截至 2019 年 9 月的不同电池车辆组。 |
| 供电排放强度 | 中电 0.34，港灯 0.59 kg CO₂e/kWh。 | [中电 2025 年独立鉴证报告](https://www.clpgroup.com/content/dam/clp-group/channels/sustainability/document/sustainability-report/2025/CLP_Independent_Assurance_Statement_2025.pdf.coredownload.pdf)、[港灯 2025 年可持续发展报告](https://www.hkelectric.com/documents/zh/CorporateSocialResponsibility/CorporateSocialResponsibility_CDD/Documents/SR2025C_statistics.pdf)。两者均以 2025 年售出电量计，中电数值为可再生能源证书调整前。按车厂供电商选择。 |
| 柴油直燃排放系数 | 模型采用 2.614 kg CO₂/L。 | [香港环保署碳审计指南，表 2-1](https://cnsd.gov.hk/wp-content/uploads/2024/01/EPD_CA_Guidebook_Office_English.pdf)。电力侧采用供电商的 CO₂e 口径。 |
| 单车年里程 | 约 64,000 km/车年。 | [香港运输署《运输资料年报 2025》，九巴](https://www.td.gov.hk/mini_site/atd/2025/en/section5-5.html)。2024 营运 256,189,000 车公里 ÷ 年末 4,010 辆注册车 = 63,888 km/车，作为车队量级参照。 |
| 车队结构和价格敏感性 | 全港专营车队双层占比约 96%。2025 首次登记资料的电动专营巴士平均税前溢价 37.7%。 | [2026 年香港电动车路线图更新版，图 8 及第 4.6 段](https://www.eeb.gov.hk/sites/default/files/pdf/Updated_EV_Roadmap_eng.pdf)。车队占比可用于构造组合情景，600 辆计划实际车型比例有待核查。37.7% 是首次登记样本税前平均值。 |

## 计算边界

- 柴油运营排放按服务公里 × 柴油消耗量（L/km）× 柴油系数。纯电运营排放按相同服务公里 × 售电侧用量（kWh/km）× 供电系数。默认把历史电耗用作车辆端情景值，除以 90% 的假设充电效率。使用车厂电表实测购电量时，把效率设为 100%，避免重复计算损耗。
- 运营减排量使用柴油基准减去电动方案，保留负值。以真正替代或在替代情景下等量服务的里程计算。若车辆是扩充服务，须给出该服务原本用柴油承担的反事实，或分开显示新增运营排放。
- 采用直燃与购电排放的运营边界。电池与车辆制造、燃料上游、车厂工程和报废未纳入计算。
- 将按车型和电动购置价格推导的潜在所需资助与 HK$470m 预留额度比较。举例，假定 576 辆双层、24 辆单层均达到资助上限，所需资助为 HK$470.4m。可展示差额 HK$0.4m，并把实际批核及拨付留给相应记录确认。
