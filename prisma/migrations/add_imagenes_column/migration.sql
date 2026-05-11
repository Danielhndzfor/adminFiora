-- AddColumn imagenes
ALTER TABLE `Producto` ADD COLUMN `imagenes` LONGTEXT;

-- Migrate data from imagen to imagenes (convert single URL to JSON array)
UPDATE `Producto`
SET `imagenes` = IF(
  `imagen` IS NOT NULL AND `imagen` != '',
  CONCAT(
    '[{"url":"',
    REPLACE(`imagen`, '"', '\\"'),
    '","nombreArchivo":"","orden":1,"creadoEn":"',
    DATE_FORMAT(NOW(), '%Y-%m-%dT%H:%i:%sZ'),
    '"}]'
  ),
  NULL
)
WHERE `imagen` IS NOT NULL AND `imagen` != '';

-- DropColumn imagen
ALTER TABLE `Producto` DROP COLUMN `imagen`;
