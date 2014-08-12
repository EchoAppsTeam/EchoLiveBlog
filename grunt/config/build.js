module.exports = {
	options: {
		tasks: {
			dev: [
				'copy:js',
				'concat'
			],
			min: [
				'copy:js',
				'uglify',
				'concat'
			]
		}
	}
};
