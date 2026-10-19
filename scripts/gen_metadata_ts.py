import json

fields = json.load(open("scripts/meta_fields.json", encoding="utf-8"))


def esc(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "\\'")


lines = []
lines.append("/* ============================================================")
lines.append("   食管癌元数据标准字段库 —— 数据来源：医院提供《食管癌元数据（完整版）》")
lines.append(f"   共 {len(fields)} 个标准字段，全部纳入系统，不做删减")
lines.append("   由 scripts/gen_metadata_ts.py 从 Excel 生成，请勿手工改动")
lines.append("   ============================================================ */")
lines.append("")
lines.append("export interface StandardField {")
lines.append("  /** 标准字段中文名称 */")
lines.append("  cn: string")
lines.append("  /** 标准字段英文名称 */")
lines.append("  en: string")
lines.append("  /** 标准编码（缩写词） */")
lines.append("  code: string")
lines.append("  /** 数据类型 */")
lines.append("  dataType: string")
lines.append("  /** 值域 */")
lines.append("  domain: string")
lines.append("  /** 约束：M 必填 / O 可选 */")
lines.append("  constraint: string")
lines.append("  /** 数据分类 */")
lines.append("  category: string")
lines.append("}")
lines.append("")
lines.append("export const standardFields: StandardField[] = [")
for f in fields:
    lines.append(
        "  { cn: '%s', en: '%s', code: '%s', dataType: '%s', domain: '%s', constraint: '%s', category: '%s' },"
        % (
            esc(f["cn"]),
            esc(f["en"]),
            esc(f["abbr"]),
            esc(f["dtype"]),
            esc(f["domain"]),
            esc(f["constraint"]),
            esc(f["category"]),
        )
    )
lines.append("]")
lines.append("")
lines.append("/** 数据分类（按元数据中出现顺序） */")
cats = []
for f in fields:
    if f["category"] not in cats:
        cats.append(f["category"])
lines.append("export const standardCategories: string[] = [")
for c in cats:
    lines.append("  '%s'," % esc(c))
lines.append("]")
lines.append("")
lines.append("/** 按分类统计字段数 */")
lines.append("export function fieldCountOf(category: string): number {")
lines.append("  return standardFields.filter((f) => f.category === category).length")
lines.append("}")
lines.append("")

out = "src/mock/esophagusMetadata.ts"
with open(out, "w", encoding="utf-8", newline="\n") as fp:
    fp.write("\n".join(lines))
print("written:", out, "fields:", len(fields), "categories:", len(cats))
