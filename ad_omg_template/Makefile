
TOOLS=../../eeditor/tools
LOG_LEVEL=debug
TARGET?=ALL
ARGS := $(MAKECMDGOALS)
ARG1 := $(word 2,$(ARGS))

BUILD_:
	node ${TOOLS}/builder --target=${TARGET} --log=${LOG_LEVEL} --colorize

ALL:
	make BUILD_ TARGET=$@

ATLAS:
	make BUILD_ TARGET=$@

LOC_ATLASES:
	make BUILD_ TARGET=$@

SOUNDS:
	make BUILD_ TARGET=$@

ICONS:
	make BUILD_ TARGET=$@

PREVIEWS:
	make BUILD_ TARGET=$@

DATA:
	make BUILD_ TARGET=$@

JSMINIFY:
	make BUILD_ TARGET=$@

PRODUCTION:
	make BUILD_ TARGET=$@

PRODUCTION_ALL:
	make BUILD_ TARGET=$@

PROJECTFILE:
	make BUILD_ TARGET=$@

UPLOAD:
	make BUILD_ TARGET=$@

UNWIND:
	make BUILD_ TARGET=$@

AD:
	node ${TOOLS}/builder --target=SETUP --log=debug --colorize=1 AD=$(ARG1)

FONT:
	node ${TOOLS}/builder --target=OPTIMIZE_FONTS --log=debug --colorize=1

PARSE_SVG:
	node ${TOOLS}/builder --target=PARSE_SVG --log=debug --colorize=1

SVG_BIN:
	make BUILD_ TARGET=$@

BATCH_BUILD:
	make BUILD_ TARGET=$@

PACK_ZIPS_ALL:
	make BUILD_ TARGET=$@

