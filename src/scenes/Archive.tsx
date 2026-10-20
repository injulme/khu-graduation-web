import { Asset } from '../components/Asset'
import { ARCHIVE_ROWS } from '../lib/assets'
import { frameRatio } from '../lib/image-sizes'

export function Archive() {
  return (
    <section className="archive" aria-label="FIELD ARCHIVE">
      {ARCHIVE_ROWS.map(({ row, caps, index }) => (
        <div className="archive__group js-archive-row" key={row}>
          <Asset
            className="archive__row photo js-focus"
            name={row}
            alt={`현장 기록 ${index + 1}번째 행`}
            eager={index < 2}
            style={{ width: `${frameRatio(row)}%` }}
          />
          <Asset className="archive__caps ink" name={caps} style={{ width: `${frameRatio(caps)}%` }} />
        </div>
      ))}
    </section>
  )
}
