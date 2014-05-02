module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-webpack');
  grunt.loadNpmTasks('grunt-dox');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
    },
    concat: {
      sjcl: {
        src: [
          "src/js/sjcl/core/sjcl.js",
          "src/js/sjcl/core/aes.js",
          "src/js/sjcl/core/bitArray.js",
          "src/js/sjcl/core/codecString.js",
          "src/js/sjcl/core/codecHex.js",
          "src/js/sjcl/core/codecBase64.js",
          "src/js/sjcl/core/codecBytes.js",
          "src/js/sjcl/core/sha256.js",
          "src/js/sjcl/core/sha512.js",
          "src/js/sjcl/core/sha1.js",
          "src/js/sjcl/core/ccm.js",
//          "src/js/sjcl/core/cbc.js",
//          "src/js/sjcl/core/ocb2.js",
          "src/js/sjcl/core/hmac.js",
          "src/js/sjcl/core/pbkdf2.js",
          "src/js/sjcl/core/random.js",
          "src/js/sjcl/core/convenience.js",
          "src/js/sjcl/core/bn.js",
          "src/js/sjcl/core/ecc.js",
          "src/js/sjcl/core/srp.js",
          "src/js/sjcl-custom/sjcl-ecc-pointextras.js",
          "src/js/sjcl-custom/sjcl-secp256k1.js",
          "src/js/sjcl-custom/sjcl-ripemd160.js",
          "src/js/sjcl-custom/sjcl-extramath.js",
          "src/js/sjcl-custom/sjcl-montgomery.js",
          "src/js/sjcl-custom/sjcl-validecc.js",
          "src/js/sjcl-custom/sjcl-ecdsa-canonical.js",
          "src/js/sjcl-custom/sjcl-ecdsa-der.js",
          "src/js/sjcl-custom/sjcl-ecdsa-recoverablepublickey.js",
          "src/js/sjcl-custom/sjcl-jacobi.js"
        ],
        dest: 'build/sjcl.js'
      }
    },
    webpack: {
      options: {
        entry: "./src/js/ripple/index.js",
        output: {
          library: "ripple"
        },
        cache: true
      },
      lib: {
        output: {
          filename: "build/ripple-<%= pkg.version %>.js"
        }
      },
      lib_debug: {
        output: {
          filename: "build/ripple-<%= pkg.version %>-debug.js"
        },
        debug: true,
        devtool: 'eval'
      },
      lib_min: {
        output: {
          filename: "build/ripple-<%= pkg.version %>-min.js"
        },
        optimize: {
          minimize: true
        }
      }
    },
    watch: {
      sjcl: {
        files: ['<%= concat.sjcl.src %>'],
        tasks: 'concat:sjcl'
      },
      lib: {
        files: 'src/js/ripple/*.js',
        tasks: 'webpack:lib_debug'
      }
    },
    dox: {
      libdocs: {
        options: {
          title: "Test"
        },
        src: ['src/js/ripple/'],
        dest: 'build/docs'
      }
    }
  });

  // Tasks
  grunt.registerTask('default', ['concat:sjcl', 'webpack']);

};
