/**
 * Internal dependencies
 */
/**
 * WordPress dependencies
 */
const { __ } = wp.i18n;
const { select, dispatch } = wp.data;
const { withInstanceId } = wp.compose;
const { Fragment, Component } = wp.element;
const { parse, createBlock } = wp.blocks;
const { MediaUploadCheck } = wp.blockEditor;
const { DropZone, FormFileUpload, Placeholder, Notice, TextControl, Button } = wp.components;

/**
 * Get settings.
 */
let settings;
wp.api.loadPromise.then(() => {
	settings = new wp.api.models.Settings();
});

const apiPath = "https://staging-shareablock.kinsta.cloud/edd-api/my-files";

/**
 * Block edit function
 */
class Edit extends Component {
	constructor() {
		super(...arguments);

		this.state = {
			apiKey: '',
			accessToken: '',
			isSaving: false,
			keySaved: false,
			isSavedKey: false,
			isLoading: false,
			downloads: {},
			error: null,
		};

		settings.on('change:shareablock_api_key', (model) => {
			const apiSettings = JSON.parse(model.get('shareablock_api_key'));
			this.setState({
				apiKey: apiSettings.apiKey,
				accessToken: apiSettings.accessToken,
				isSavedKey: apiSettings.apiKey !== '',
			});
		});

		settings.fetch().then((response) => {
			if( typeof response.shareablock_api_key !== 'undefined' && response.shareablock_api_key ){
				const apiSettings = JSON.parse(response.shareablock_api_key);
				this.setState({ apiKey: apiSettings.apiKey, accessToken: apiSettings.accessToken, isSavedKey: true });
			}
		});

		this.saveApiKey = this.saveApiKey.bind(this);
		this.updateApiKey = this.updateApiKey.bind(this);
		this.fetchDownloads = this.fetchDownloads.bind(this);

	}

	componentDidMount() {
	}

	componentWillUnmount() {
	}

	updateApiKey(apiKey = this.state.apiKey, accessToken = this.state.accessToken) {
		const { attributes, setAttributes } = this.props;
		apiKey = apiKey.trim();
		accessToken = accessToken.trim();

		this.saveApiKey(apiKey, accessToken);

		if (apiKey === '') {
			setAttributes({ hasApiKey: false });
			return;
		}
	}

	saveApiKey(apiKey = this.state.apiKey, accessToken = this.state.accessToken) {
		this.setState({ apiKey, accessToken, isSaving: true });

		const model = new wp.api.models.Settings({
			shareablock_api_key: JSON.stringify({ apiKey, accessToken } ),
		});

		model.save().then(() => {
			this.setState({
				isSaving: false,
				keySaved: true,
			});
			settings.fetch();

			this.fetchDownloads(apiKey, accessToken);
		});
	}

	fetchDownloads(apiKey = this.state.apiKey, accessToken = this.state.accessToken){
		this.setState({ isLoading: true });
		const fetchApi = async () => {
			let response = await fetch(
				`${apiPath}?key=${apiKey}&token=${accessToken}`
			).catch(error => this.setState({ error, isLoading: false }));

			let data = await response.json();
			
			this.setState({ downloads: data, isLoading: false });
		};

		fetchApi();
	}

	render() {

		return (
			<Placeholder
				icon="layout"
				label={__("ShareABlock from EditorsKit", "block-options")}
				instructions={__(
					"Insert your downloads from shareablock.com at ease.",
					"block-options"
				)}
			>
				<Fragment>
					{this.state.isLoading ? 'loading': ''}
					<TextControl
						value={this.state.apiKey}
						label={__("API Settings", "block-options")}
						placeholder={__("Enter Public API Key…", "block-options")}
						onChange={newKey => {
							this.setState({ apiKey: newKey });
						}}
					/>
					<TextControl
						value={this.state.accessToken}
						placeholder={__("Enter Access Token…", "block-options")}
						help={__(
							"You will only be asked once for API keys. Learn more on how to generate you API key and access token.",
							"block-options"
						)}
						onChange={newToken => {
							this.setState({ accessToken: newToken });
						}}
					/>
					<Button
						isPrimary
						isLarge
						onClick={() => {
							this.updateApiKey();
						}}
					>
						{__("Apply & View Downloads", "block-options")}
					</Button>
				</Fragment>
			</Placeholder>
		);
	}
}

export default withInstanceId(Edit);
