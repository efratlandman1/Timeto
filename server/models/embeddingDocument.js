const mongoose = require('mongoose');

const EmbeddingDocumentSchema = new mongoose.Schema(
	{
		// Original text/content stored for retrieval
		content: {
			type: String,
			required: true,
			trim: true,
			minlength: 1,
		},
		// Optional title/identifier for easier debugging
		title: {
			type: String,
			trim: true,
		},
		// Arbitrary metadata (non-sensitive)
		metadata: {
			type: mongoose.Schema.Types.Mixed,
			default: {},
		},
		// Numeric vector for embeddings (OpenAI text-embedding-3-small = 1536 dims)
		embedding: {
			type: [Number],
			required: true,
			validate: {
				validator: function (arr) {
					return Array.isArray(arr) && arr.length > 0 && arr.every((n) => typeof n === 'number' && Number.isFinite(n));
				},
				message: 'Invalid embedding vector',
			},
			index: true,
		},
		active: {
			type: Boolean,
			default: true,
		},
	},
	{ timestamps: true }
);

// Helpful text index for optional keyword search blending
EmbeddingDocumentSchema.index({ content: 'text', title: 'text' });

module.exports = mongoose.model('EmbeddingDocument', EmbeddingDocumentSchema);


