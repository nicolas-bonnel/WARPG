# Set the source directory
srcdir = js/

all: warpg-dev.js warpg.js

# Create the list of modules
modules =   ${srcdir}area.js\
            ${srcdir}character.js\
            ${srcdir}collision.js\
            ${srcdir}effect.js\
            ${srcdir}ia.js\
            ${srcdir}item.js\
            ${srcdir}loader.js\
            ${srcdir}mesh.js\
            ${srcdir}object3d.js\
            ${srcdir}particle.js\
            ${srcdir}projectile.js\
            ${srcdir}quat.js\
            ${srcdir}quests.js\
            ${srcdir}renderer.js\
            ${srcdir}skills.js\
            ${srcdir}utils.js\
            ${srcdir}world.js


# Concatenate all of the modules into warpg.js
warpg-dev.js: ${modules}
	cat > $@ $^

# Minimize with google's closure compiler
warpg.js: warpg-dev.js
	java -jar compiler.jar --js=$< > $@
