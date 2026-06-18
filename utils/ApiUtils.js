class ApiUtils {
  constructor(req) {
    this.req = req;
    this.query = req && req.query ? req.query : {};
  }

  parseIntSafe(v, def) {
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? def : n;
  }

  getPage() {
    return Math.max(1, this.parseIntSafe(this.query.page, 1));
  }

  getLimit(maxLimit = 100) {
    const l = this.parseIntSafe(this.query.limit, 10);
    return Math.max(1, Math.min(maxLimit, l));
  }

  getSelect() {
    return this.query.select || null;
  }

  getSort(defaultSort) {
    const s = this.query.sort;
    if (!s) return defaultSort || null;
    // support comma separated fields, prefix with - for desc
    const parts = String(s).split(",");
    const sortObj = {};
    for (const p of parts) {
      if (!p) continue;
      if (p.startsWith("-")) sortObj[p.slice(1)] = -1;
      else sortObj[p] = 1;
    }
    return sortObj;
  }

  buildFilter(filterMap = {}, baseFilter = {}) {
    const filter = {};
    for (const [k, v] of Object.entries(this.query)) {
      if (["page", "limit", "sort", "select"].includes(k)) continue;
      if (filterMap && filterMap[k]) {
        Object.assign(filter, filterMap[k](v, this.req));
      } else {
        // support query operator syntax like price[lte]=10 -> { price: { $lte: 10 } }
        if (v && typeof v === "object" && !Array.isArray(v)) {
          const opObj = {};
          for (const [op, val] of Object.entries(v)) {
            const mongoOp = op.startsWith("$") ? op : `$${op}`;
            // coerce numeric-like values to Number
            let parsedVal = val;
            if (typeof val === "string") {
              // handle comma-separated lists for $in/$nin
              if (mongoOp === "$in" || mongoOp === "$nin") {
                parsedVal = val
                  .split(",")
                  .map((s) =>
                    s === "" ? s : s.match(/^\d+$/) ? Number(s) : s,
                  );
              } else if (val.match(/^[-+]?\d+(?:\.\d+)?$/)) {
                parsedVal = Number(val);
              }
            }
            opObj[mongoOp] = parsedVal;
          }
          filter[k] = opObj;
        } else {
          filter[k] = v;
        }
      }
    }
    if (typeof baseFilter === "function")
      Object.assign(filter, baseFilter(this.req) || {});
    else if (baseFilter && typeof baseFilter === "object")
      Object.assign(filter, baseFilter);
    return filter;
  }

  getOptions({
    filterMap = {},
    baseFilter = {},
    defaultSort = null,
    maxLimit = 100,
  } = {}) {
    const page = this.getPage();
    const limit = this.getLimit(maxLimit);
    const select = this.getSelect();
    const sort = this.getSort(defaultSort);
    const filter = this.buildFilter(filterMap, baseFilter);
    return { page, limit, select, sort, filter };
  }
}

module.exports = ApiUtils;
