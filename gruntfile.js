module.exports = function(grunt) {
	/*
	 * Common options
	 */

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-processhtml');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-clean');

	var config = {
		pkg : grunt.file.readJSON('package.json'),
		concat : {
			options : {
				separator : ';\n'
			}
		},
		uglify : {
			options : {
				banner : '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
			}
		},
		qunit : {},
		jshint : {
			options : {
                                evil: true,
				globals : {
					jQuery : true,
					console : true,
					module : true,
					document : true
				}
			}
		},
		processhtml : {
			options : {}
		},
		copy : {},
		clean : {}
	};

	/*
	 * default: build the site to the build-result directory test: just tests
	 */

	config.concat.build = {
		src : ['src/js/high-performance-treeview.js',
				'src/js/scrollbar-custom-binding.js',
				'src/js/json-slicer.js'],
		dest : 'work/<%= pkg.name %>.js'
	};
	config.uglify.build = {
		files : {
			'build-result/<%= pkg.name %>.min.js' : ['work/<%= pkg.name %>.js']
		}
	};
	config.qunit.build = ['test/**/*.html'];
	config.jshint.build = ['Gruntfile.js', 'src/**/*.js', 'test/*.js'];
	config.processhtml.build = {
		files : {
			'build-result/index.html' : 'src/index.html'
		}
	};
	config.copy.build = {
		files : [
		{
			expand : true,
			cwd : 'src/',
			src : ['images/**', 'style.css', 'js/example.js'],
			dest : 'build-result'
		}]
	};
	config.clean.build = {
		src : ["build-result/", "work/"]
	};

	grunt.registerTask('test', ['jshint:build', 'qunit:build']);
	grunt.registerTask('default', ['clean:build', 'jshint:build',
			'qunit:build', 'concat:build', 'uglify:build', 'processhtml:build',
			'copy:build']);

	/*
	 * deploy: default build + deploy to /var/www/www.samuelrossille.com/json-slicer
	 */

	config.copy.deploy = {
		files : [
		{
			expand : true,
			cwd : 'build-result/',
			src : ['**'],
			dest : '/var/www/www.samuelrossille.com/json-slicer'
		}]
	};
	config.clean.deploy = {
		deploy : {
			src : ['/var/www/www.samuelrossille.com/json-slicer'],
			options : {
				force : true
			}
		}
	};

	grunt.registerTask('deploy', ['clean:deploy', 'copy:deploy']);

	grunt.initConfig(config);
};