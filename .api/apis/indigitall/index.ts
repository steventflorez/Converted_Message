import type * as types from './types';
import type { ConfigOptions, FetchResponse } from 'api/dist/core'
import Oas from 'oas';
import APICore from 'api/dist/core';
import definition from './openapi.json';

class SDK {
  spec: Oas;
  core: APICore;

  constructor() {
    this.spec = Oas.init(definition);
    this.core = new APICore(this.spec, 'indigitall/1.0.0 (api/6.1.2)');
  }

  /**
   * Optionally configure various options that the SDK allows.
   *
   * @param config Object of supported SDK options and toggles.
   * @param config.timeout Override the default `fetch` request timeout of 30 seconds. This number
   * should be represented in milliseconds.
   */
  config(config: ConfigOptions) {
    this.core.setConfig(config);
  }

  /**
   * If the API you're using requires authentication you can supply the required credentials
   * through this method and the library will magically determine how they should be used
   * within your API request.
   *
   * With the exception of OpenID and MutualTLS, it supports all forms of authentication
   * supported by the OpenAPI specification.
   *
   * @example <caption>HTTP Basic auth</caption>
   * sdk.auth('username', 'password');
   *
   * @example <caption>Bearer tokens (HTTP or OAuth 2)</caption>
   * sdk.auth('myBearerToken');
   *
   * @example <caption>API Keys</caption>
   * sdk.auth('myApiKey');
   *
   * @see {@link https://spec.openapis.org/oas/v3.0.3#fixed-fields-22}
   * @see {@link https://spec.openapis.org/oas/v3.1.0#fixed-fields-22}
   * @param values Your auth credentials for the API; can specify up to two strings or numbers.
   */
  auth(...values: string[] | number[]) {
    this.core.setAuth(...values);
    return this;
  }

  /**
   * If the API you're using offers alternate server URLs, and server variables, you can tell
   * the SDK which one to use with this method. To use it you can supply either one of the
   * server URLs that are contained within the OpenAPI definition (along with any server
   * variables), or you can pass it a fully qualified URL to use (that may or may not exist
   * within the OpenAPI definition).
   *
   * @example <caption>Server URL with server variables</caption>
   * sdk.server('https://{region}.api.example.com/{basePath}', {
   *   name: 'eu',
   *   basePath: 'v14',
   * });
   *
   * @example <caption>Fully qualified server URL</caption>
   * sdk.server('https://eu.api.example.com/v14');
   *
   * @param url Server URL
   * @param variables An object of variables to replace into the server URL.
   */
  server(url: string, variables = {}) {
    this.core.setServer(url, variables);
  }

  /**
   * Authorizes a user and returns token for accesing the API. The user must already exist in
   * the system.
   *
   * The returned token can be JWT or 2FA short lived JWT, depends if 2fa is enabled on the
   * user account.
   *
   * If the request has a valid Bearer Token with 2FA Long lived JWT and 2FA is enabled,
   * returns JWT and user data.
   *
   * If the request has not the Bearer Token with 2FA Long lived JWT but the 2FA is enabled,
   * returns a short lived JWT.
   *
   * @summary Authorize a user and returns a TOKEN
   * @throws FetchError<401, types.PostAuthResponse401> Invalid credentials
   * @throws FetchError<500, types.PostAuthResponse500> Server errors
   */
  postAuth(body: types.PostAuthBodyParam): Promise<FetchResponse<200, types.PostAuthResponse200>> {
    return this.core.fetch('/auth', 'post', body);
  }

  /**
   * Authorizes a user if the totp code and 2fa short lived token (required in the header)
   * are valids, and returns JWT and 2FA Long Lived Tokens for accesing the API.
   *
   * The user must already exist in the system.
   *
   * @summary Authorize an user wich 2FA is enabled and returns a TOKEN
   * @throws FetchError<401, types.Post2FaAuthResponse401> Invalid credentials
   * @throws FetchError<500, types.Post2FaAuthResponse500> Server errors
   */
  post2FaAuth(body: types.Post2FaAuthBodyParam): Promise<FetchResponse<200, types.Post2FaAuthResponse200>> {
    return this.core.fetch('/auth/2fa/validate', 'post', body);
  }

  /**
   * Refresh short lived JWT and generate a new TOTP code. A Bearer Token with short lived
   * JWT is required in the header.
   *
   * @summary Refresh short lived JWT and TOTP code
   */
  get2FaRefresh(): Promise<FetchResponse<200, types.Get2FaRefreshResponse200>> {
    return this.core.fetch('/auth/2fa/refresh', 'get');
  }

  /**
   * Create a new user for the selected account (accountId). 
   * The body must include next fileds:  * the userType fields ('human' or 'sever'),  *
   * roleType ('account_admin' or 'application_user'),  * accountId (account id) and enabled
   * ('true' to activate the user). 
   * If the user is a 'human' type, you must include 'email' and 'password'. 
   * If the **roleType** is **'application_user'** you must in addition to this call another
   * one to enable the permissions [/user/{id}/permission](#/users/postUserPermission).
   *
   * @summary Create a New User
   * @throws FetchError<400, types.PostUserResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostUserResponse401> Invalid credentials
   * @throws FetchError<403, types.PostUserResponse403> Operation forbidden for your user
   * @throws FetchError<409, types.PostUserResponse409> Email already in use
   * @throws FetchError<500, types.PostUserResponse500> Server error
   */
  postUser(body: types.PostUserBodyParam): Promise<FetchResponse<201, types.PostUserResponse201>> {
    return this.core.fetch('/user', 'post', body);
  }

  /**
   * Gets a paged list with the users of an account with all the data like the email, type of
   * user, name, language or permissions. Additionaly, return a field with the user total for
   * that account. 
   * Necessary query's parameters: * Id of the account (**accountId**), * Limit of user per
   * view (**limit**)   * Page to show (**page**) at least 0.  Optional filters: * Status
   * active (**enabled**) * Role type (**roleType**)  * User type (**userType**)  * Search by
   * _name_, _email_, _serverId_ or _description_ (**find**).
   *
   * @summary List of Users for an account data
   * @throws FetchError<400, types.GetUsersResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetUsersResponse401> Invalid credentials
   * @throws FetchError<403, types.GetUsersResponse403> Operation forbidden for your user
   * @throws FetchError<500, types.GetUsersResponse500> Server error
   */
  getUsers(metadata: types.GetUsersMetadataParam): Promise<FetchResponse<200, types.GetUsersResponse200>> {
    return this.core.fetch('/user', 'get', metadata);
  }

  /**
   * Gets a user by id. Only for users of the account to which the requesting user belongs
   *
   * @summary Show User for the given id
   */
  getSingleUser(metadata: types.GetSingleUserMetadataParam): Promise<FetchResponse<200, types.GetSingleUserResponse200> | FetchResponse<number, types.GetSingleUserResponseDefault>> {
    return this.core.fetch('/user/{id}', 'get', metadata);
  }

  /**
   * Updates the user. Only for users of the account to which the requesting user belongs
   *
   * @summary Update user with the given id
   * @throws FetchError<400, types.PutUserResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PutUserResponse401> Invalid credentials
   * @throws FetchError<403, types.PutUserResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PutUserResponse404> User not found
   * @throws FetchError<500, types.PutUserResponse500> Server error
   */
  putUser(body: types.PutUserBodyParam, metadata: types.PutUserMetadataParam): Promise<FetchResponse<200, types.PutUserResponse200>> {
    return this.core.fetch('/user/{id}', 'put', body, metadata);
  }

  /**
   * Delete the user. Only for users of the account to which the requesting user belongs.
   *
   * @summary Delete a user with the given id
   * @throws FetchError<401, types.DeleteUserResponse401> Invalid credentials
   * @throws FetchError<403, types.DeleteUserResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.DeleteUserResponse404> User not found
   * @throws FetchError<500, types.DeleteUserResponse500> Server error
   */
  deleteUser(metadata: types.DeleteUserMetadataParam): Promise<FetchResponse<200, types.DeleteUserResponse200>> {
    return this.core.fetch('/user/{id}', 'delete', metadata);
  }

  /**
   * Adds profile image to user. These types are valid: **'image/jpeg'**, **'image/png'**
   *
   *
   * @summary Add image to user profile
   * @throws FetchError<400, types.PostUserImageResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostUserImageResponse401> Invalid credentials
   * @throws FetchError<403, types.PostUserImageResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PostUserImageResponse404> Campaign not found
   * @throws FetchError<500, types.PostUserImageResponse500> Server error
   */
  postUserImage(body: types.PostUserImageBodyParam, metadata: types.PostUserImageMetadataParam): Promise<FetchResponse<200, types.PostUserImageResponse200>> {
    return this.core.fetch('/user/{id}/image', 'post', body, metadata);
  }

  /**
   * Set permissions for the selected user. 
   * Requires this data:  * Id group of permissions (**groupId**: this id is unique by
   * application and relates the application with a type of role.  Check with the endpoint
   * [/user/roles](#/users/getWebRoles).  * Id of the application (**applicationId**)  * Id
   * of the user (**userId**). 
   * Only necessary for role user type **'application_user'**.
   *
   * **IMPORTANT**
   * To set permissions for super users the applicationId or accountId must be specified. The
   * user of the request must have permissions on the account of the user to be given
   * permissions and on the account to be given permissions.
   * Only can give account permissions to super users
   *
   * @summary Set specific permission to user with given id
   * @throws FetchError<400, types.PostUserPermissionResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostUserPermissionResponse401> Invalid credentials
   * @throws FetchError<403, types.PostUserPermissionResponse403> Operation forbidden for your user
   * @throws FetchError<409, types.PostUserPermissionResponse409> Email already in use
   * @throws FetchError<500, types.PostUserPermissionResponse500> Server error
   */
  postUserPermission(body: types.PostUserPermissionBodyParam, metadata: types.PostUserPermissionMetadataParam): Promise<FetchResponse<201, types.PostUserPermissionResponse201>> {
    return this.core.fetch('/user/{id}/permission', 'post', body, metadata);
  }

  /**
   * Deletes a user's permission for the application
   *
   * @summary Delete specific permission from user with given id
   * @throws FetchError<400, types.DeleteUserPermissionResponse400> Parameters missing or not in right format
   * @throws FetchError<403, types.DeleteUserPermissionResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.DeleteUserPermissionResponse404> Application or device not found
   * @throws FetchError<500, types.DeleteUserPermissionResponse500> Server error
   */
  deleteUserPermission(body: types.DeleteUserPermissionBodyParam, metadata: types.DeleteUserPermissionMetadataParam): Promise<FetchResponse<200, types.DeleteUserPermissionResponse200>> {
    return this.core.fetch('/user/{id}/permission', 'delete', body, metadata);
  }

  /**
   * Invite a user to register on the platform by sending an email. 
   * The user will receive a link from which it can complete the registration on the
   * platform.
   *
   * @summary Sends invitation email to the given email
   * @throws FetchError<400, types.PostInviteUserResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostInviteUserResponse401> Invalid credentials
   * @throws FetchError<403, types.PostInviteUserResponse403> Operation forbidden for your user
   * @throws FetchError<409, types.PostInviteUserResponse409> User already exists
   * @throws FetchError<500, types.PostInviteUserResponse500> Server error
   */
  postInviteUser(body: types.PostInviteUserBodyParam): Promise<FetchResponse<200, types.PostInviteUserResponse200>> {
    return this.core.fetch('/user/invite', 'post', body);
  }

  /**
   * Sends a email to the user with the procedure to reset the password
   *
   * @summary Sends email to the user with reset procedure
   * @throws FetchError<400, types.PostUserRecoverResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostUserRecoverResponse401> Invalid credentials
   * @throws FetchError<403, types.PostUserRecoverResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PostUserRecoverResponse404> Email does not exists
   * @throws FetchError<500, types.PostUserRecoverResponse500> Server error
   */
  postUserRecover(body: types.PostUserRecoverBodyParam): Promise<FetchResponse<200, types.PostUserRecoverResponse200>> {
    return this.core.fetch('/user/recover', 'post', body);
  }

  /**
   * Get a listing with the roles that exist for the users of the account. You need the
   * account id (**accountId**)
   *
   * @summary Show list of roles assignable to users
   * @throws FetchError<401, types.GetWebRolesResponse401> Invalid credentials
   * @throws FetchError<404, types.GetWebRolesResponse404> User not found
   * @throws FetchError<500, types.GetWebRolesResponse500> Server error
   */
  getWebRoles(metadata?: types.GetWebRolesMetadataParam): Promise<FetchResponse<200, types.GetWebRolesResponse200>> {
    return this.core.fetch('/user/roles', 'get', metadata);
  }

  /**
   * Registers a new user.
   * If you want to create new user via API , please use the POST [/user](#/users/postUser)
   * endpoint, not this one. Requires a special token, which you get through the endpoint
   * [/user/invite](#/users/postInviteUser).
   *
   *
   * @summary Registers a new user
   * @throws FetchError<400, types.PostUserRegisterResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostUserRegisterResponse401> Invalid credentials
   * @throws FetchError<403, types.PostUserRegisterResponse403> Operation forbidden for your user
   * @throws FetchError<409, types.PostUserRegisterResponse409> Email already in use
   * @throws FetchError<500, types.PostUserRegisterResponse500> Server error
   */
  postUserRegister(body: types.PostUserRegisterBodyParam): Promise<FetchResponse<200, types.PostUserRegisterResponse200>> {
    return this.core.fetch('/user/register', 'post', body);
  }

  /**
   * Changes user password. Better use PUT [/user/](#/users/putUser). 
   * Requires a special token, which you get through the endpoint
   * [/user/recover](#/users/postUserRecover)
   *
   *
   * @summary Changes user password
   * @throws FetchError<400, types.PostUserResetPasswordResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostUserResetPasswordResponse401> Invalid credentials
   * @throws FetchError<403, types.PostUserResetPasswordResponse403> Operation forbidden for your user
   * @throws FetchError<500, types.PostUserResetPasswordResponse500> Server error
   */
  postUserResetPassword(body: types.PostUserResetPasswordBodyParam): Promise<FetchResponse<200, types.PostUserResetPasswordResponse200>> {
    return this.core.fetch('/user/resetPassword', 'post', body);
  }

  /**
   * Create an application for the specified account.
   * These parameters are required: * Application's name (**name**)  * Id of the account
   * (**accountId**). 
   * Additionaly you must indicate the platforms where it will be available
   * (_androidEnabled_, _iosEnabled_, _webpushEnabled_, _safariEnabled_ or _harmonyEnabled_).
   *
   * All active platforms (_true_), must also carry the fields related to it, for  example:
   * **androidGcmKey**, if android is active
   *
   * @summary Create application
   * @throws FetchError<400, types.PostApplicationResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostApplicationResponse401> Invalid credentials
   * @throws FetchError<403, types.PostApplicationResponse403> Operation forbidden for your user
   * @throws FetchError<409, types.PostApplicationResponse409> Safari website push ID already exists
   * @throws FetchError<500, types.PostApplicationResponse500> Server error
   */
  postApplication(body: types.PostApplicationBodyParam): Promise<FetchResponse<201, types.PostApplicationResponse201>> {
    return this.core.fetch('/application', 'post', body);
  }

  /**
   * Show a list of applications in the specified account. 
   * These parameters is required: * Id of the account (**accountId**) * Limit of
   * applications per page (**limit**) * Page to show (**page**). 
   * It's possible to filter by active / non-active platforms ( _androidEnabled, iosEnabled
   * ..._) or by the name of the application (**find**)
   *
   * @summary Show an applications list
   * @throws FetchError<400, types.GetApplicationResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetApplicationResponse401> Invalid credentials
   * @throws FetchError<403, types.GetApplicationResponse403> Operation forbidden for your user
   * @throws FetchError<500, types.GetApplicationResponse500> Server error
   */
  getApplication(metadata: types.GetApplicationMetadataParam): Promise<FetchResponse<200, types.GetApplicationResponse200>> {
    return this.core.fetch('/application', 'get', metadata);
  }

  /**
   * Show the data related to the application, whose Id is passed through the path
   *
   * @summary Show application with the given id
   * @throws FetchError<400, types.GetSingleApplicationResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetSingleApplicationResponse401> Invalid credentials
   * @throws FetchError<403, types.GetSingleApplicationResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetSingleApplicationResponse404> Application not found
   * @throws FetchError<500, types.GetSingleApplicationResponse500> Server error
   */
  getSingleApplication(metadata: types.GetSingleApplicationMetadataParam): Promise<FetchResponse<200, types.GetSingleApplicationResponse200>> {
    return this.core.fetch('/application/{id}', 'get', metadata);
  }

  /**
   * "Modifies an application. If a new platform is activated, the data related to it must be
   * added. For example: **androidGcmKey** if you activate android"
   * "If an array of triggers is passed, the current list in DDBB will be deleted and
   * replaced by the contents of the new array, even if the array is empty. If not specified,
   * it will not be modified"
   *
   *
   * @summary Update application with the given id. 
   * @throws FetchError<400, types.PutApplicationResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PutApplicationResponse401> Invalid credentials
   * @throws FetchError<403, types.PutApplicationResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PutApplicationResponse404> Application not found
   * @throws FetchError<409, types.PutApplicationResponse409> Duplicated safari push ID
   * @throws FetchError<500, types.PutApplicationResponse500> Server error
   */
  putApplication(body: types.PutApplicationBodyParam, metadata: types.PutApplicationMetadataParam): Promise<FetchResponse<200, types.PutApplicationResponse200>> {
    return this.core.fetch('/application/{id}', 'put', body, metadata);
  }

  /**
   * Delete an application whose id is passing through the path
   *
   * @summary Delete application with the given id
   * @throws FetchError<400, types.DeleteApplicationResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.DeleteApplicationResponse401> Invalid credentials
   * @throws FetchError<403, types.DeleteApplicationResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.DeleteApplicationResponse404> Application not found
   * @throws FetchError<500, types.DeleteApplicationResponse500> Server error
   */
  deleteApplication(metadata: types.DeleteApplicationMetadataParam): Promise<FetchResponse<200, types.DeleteApplicationResponse200>> {
    return this.core.fetch('/application/{id}', 'delete', metadata);
  }

  /**
   * Get the external applications of the application. 
   * These paramaters are required: * Id of the application (**id**) by path  * Limit of
   * results per page (**limit**)  * Page that will be displayed (**page**) 
   * It can be filtered by name of the external app or the name of the Android package and
   * the iOS url scheme (**find**)
   *
   * @summary Show external apps list for the given application's id
   * @throws FetchError<400, types.GetApplicationExternalAppsResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetApplicationExternalAppsResponse401> Invalid credentials
   * @throws FetchError<403, types.GetApplicationExternalAppsResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetApplicationExternalAppsResponse404> Application not found
   * @throws FetchError<500, types.GetApplicationExternalAppsResponse500> Server error
   */
  getApplicationExternalApps(metadata: types.GetApplicationExternalAppsMetadataParam): Promise<FetchResponse<200, types.GetApplicationExternalAppsResponse200>> {
    return this.core.fetch('/application/{id}/externalApps', 'get', metadata);
  }

  /**
   * Add external apps to the application and return the newly added elements. In the body an
   * array is sent with objects that carry the data necessary for the registration of the new
   * external application. 
   * These parameters are required: * Name for the application (**name**)  * Name of the
   * Android package (**androidCode**) or iOS url scheme (**iosCode**).
   *
   * @summary Create external apps list for the given application id
   * @throws FetchError<400, types.PostApplicationExternalAppsResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostApplicationExternalAppsResponse401> Invalid credentials
   * @throws FetchError<403, types.PostApplicationExternalAppsResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PostApplicationExternalAppsResponse404> Application not found
   * @throws FetchError<500, types.PostApplicationExternalAppsResponse500> Server error
   */
  postApplicationExternalApps(body: types.PostApplicationExternalAppsBodyParam, metadata: types.PostApplicationExternalAppsMetadataParam): Promise<FetchResponse<200, types.PostApplicationExternalAppsResponse200>> {
    return this.core.fetch('/application/{id}/externalApps', 'post', body, metadata);
  }

  /**
   * Update external apps for the specified application id.
   * The name for the application (**name**) or / and the name of the Android package
   * (**androidCode**) and the iOS url scheme (**iosCode**) are required. It depends on the
   * field you want to modify"
   *
   * @summary Update external apps for the given application's id
   * @throws FetchError<400, types.PutApplicationExternalAppsResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PutApplicationExternalAppsResponse401> Invalid credentials
   * @throws FetchError<403, types.PutApplicationExternalAppsResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PutApplicationExternalAppsResponse404> Application not found
   * @throws FetchError<500, types.PutApplicationExternalAppsResponse500> Server error
   */
  putApplicationExternalApps(body: types.PutApplicationExternalAppsBodyParam, metadata: types.PutApplicationExternalAppsMetadataParam): Promise<FetchResponse<200, types.PutApplicationExternalAppsResponse200>> {
    return this.core.fetch('/application/{id}/externalApps', 'put', body, metadata);
  }

  /**
   * Deletes external apps for the specified application id
   *
   * @summary Delete external apps for the given application id
   * @throws FetchError<400, types.DeleteApplicationExternalAppsResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.DeleteApplicationExternalAppsResponse401> Invalid credentials
   * @throws FetchError<403, types.DeleteApplicationExternalAppsResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.DeleteApplicationExternalAppsResponse404> Application not found
   * @throws FetchError<500, types.DeleteApplicationExternalAppsResponse500> Server error
   */
  deleteApplicationExternalApps(body: types.DeleteApplicationExternalAppsBodyParam, metadata: types.DeleteApplicationExternalAppsMetadataParam): Promise<FetchResponse<200, types.DeleteApplicationExternalAppsResponse200>> {
    return this.core.fetch('/application/{id}/externalApps', 'delete', body, metadata);
  }

  /**
   * Adds topics to application and returns the newly added items.  You need send an array
   * with the different topics that will be added to the application. 
   * Each topic must have: * Topic's name (**name**) * Internal code (**code**) * Be visible
   * or not for its selection in the panel (**visible**) * if it had some other topic with
   * which it had a relationship, we should pass its id (**parentId**). 
   * These topic can be used in campaigns both to filter the devices and to register new
   * devices to these topics.
   *
   * @summary Create topics for the given application's id
   * @throws FetchError<400, types.PostApplicationTopicsResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostApplicationTopicsResponse401> Invalid credentials
   * @throws FetchError<403, types.PostApplicationTopicsResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PostApplicationTopicsResponse404> Application not found
   * @throws FetchError<409, types.PostApplicationTopicsResponse409> Topic code already exists
   * @throws FetchError<500, types.PostApplicationTopicsResponse500> Server error
   */
  postApplicationTopics(body: types.PostApplicationTopicsBodyParam, metadata: types.PostApplicationTopicsMetadataParam): Promise<FetchResponse<201, types.PostApplicationTopicsResponse201>> {
    return this.core.fetch('/application/{id}/topics', 'post', body, metadata);
  }

  /**
   * Update application's topic. 
   * In the query string we must introduce the `topicId` parameter with the id of the topic
   * to be updated. 
   * An object with the data to be updated must go in the body.
   *
   * @summary Update topics for the given application's id
   * @throws FetchError<400, types.PutApplicationTopicsResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PutApplicationTopicsResponse401> Invalid credentials
   * @throws FetchError<403, types.PutApplicationTopicsResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PutApplicationTopicsResponse404> Application not found
   * @throws FetchError<500, types.PutApplicationTopicsResponse500> Server error
   */
  putApplicationTopics(body: types.PutApplicationTopicsBodyParam, metadata: types.PutApplicationTopicsMetadataParam): Promise<FetchResponse<200, types.PutApplicationTopicsResponse200>> {
    return this.core.fetch('/application/{id}/topics', 'put', body, metadata);
  }

  /**
   * Get the topics of the application for the application that we pass through the path. 
   * Required these parameters by query string: * ***limit*** (limit of topics per page, by
   * default 0) * ***page*** (page to show, by default 0). 
   * Optionally you can filter with the parameter ***find*** by the name or code of the topic
   *
   * @summary Show topics for the given application's id
   * @throws FetchError<400, types.GetApplicationTopicsResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetApplicationTopicsResponse401> Invalid credentials
   * @throws FetchError<403, types.GetApplicationTopicsResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetApplicationTopicsResponse404> Application not found
   * @throws FetchError<500, types.GetApplicationTopicsResponse500> Server error
   */
  getApplicationTopics(metadata: types.GetApplicationTopicsMetadataParam): Promise<FetchResponse<200, types.GetApplicationTopicsResponse200>> {
    return this.core.fetch('/application/{id}/topics', 'get', metadata);
  }

  /**
   * Delete the application's topics for the selected application. The body includes an array
   * with topic's ids that you want to eliminate
   *
   * @summary Delete topics for the given application id
   * @throws FetchError<400, types.DeleteApplicationTopicsResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.DeleteApplicationTopicsResponse401> Invalid credentials
   * @throws FetchError<403, types.DeleteApplicationTopicsResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.DeleteApplicationTopicsResponse404> Application not found
   * @throws FetchError<500, types.DeleteApplicationTopicsResponse500> Server error
   */
  deleteApplicationTopics(body: types.DeleteApplicationTopicsBodyParam, metadata: types.DeleteApplicationTopicsMetadataParam): Promise<FetchResponse<200, types.DeleteApplicationTopicsResponse200>> {
    return this.core.fetch('/application/{id}/topics', 'delete', body, metadata);
  }

  /**
   * Adds areas to the selected application. 
   * The body include an object with data for the new area. The coordinates must have a
   * GeoJson format.
   * Return the new added items.
   *
   * @summary Create areas for the given application's id
   * @throws FetchError<400, types.PostApplicationAreasResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostApplicationAreasResponse401> Invalid credentials
   * @throws FetchError<403, types.PostApplicationAreasResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PostApplicationAreasResponse404> Application not found
   * @throws FetchError<500, types.PostApplicationAreasResponse500> Server error
   */
  postApplicationAreas(body: types.PostApplicationAreasBodyParam, metadata: types.PostApplicationAreasMetadataParam): Promise<FetchResponse<201, types.PostApplicationAreasResponse201>> {
    return this.core.fetch('/application/{id}/areas', 'post', body, metadata);
  }

  /**
   * List of areas of the selected application. In the query string we can indicate the limit
   * of areas to show per page, by default 100 (limit), the page to show, by default 0 (page)
   * and filter by name or tag, the exact tag (find).
   *
   * @summary Show areas for the given application's id
   * @throws FetchError<400, types.GetApplicationAreasResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetApplicationAreasResponse401> Invalid credentials
   * @throws FetchError<403, types.GetApplicationAreasResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetApplicationAreasResponse404> Application not found
   * @throws FetchError<500, types.GetApplicationAreasResponse500> Server error
   */
  getApplicationAreas(metadata: types.GetApplicationAreasMetadataParam): Promise<FetchResponse<200, types.GetApplicationAreasResponse200>> {
    return this.core.fetch('/application/{id}/areas', 'get', metadata);
  }

  /**
   * Delete the  application's  areas  for the selected application. The body includes an
   * array with area's ids that you want to eliminate.
   *
   * @summary Delete areas for the given application id
   * @throws FetchError<400, types.DeleteApplicationAreasResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.DeleteApplicationAreasResponse401> Invalid credentials
   * @throws FetchError<403, types.DeleteApplicationAreasResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.DeleteApplicationAreasResponse404> Application not found
   * @throws FetchError<500, types.DeleteApplicationAreasResponse500> Server error
   */
  deleteApplicationAreas(body: types.DeleteApplicationAreasBodyParam, metadata: types.DeleteApplicationAreasMetadataParam): Promise<FetchResponse<200, types.DeleteApplicationAreasResponse200>> {
    return this.core.fetch('/application/{id}/areas', 'delete', body, metadata);
  }

  /**
   * Update application's areas. In the query string we must introduce the topicId parameter
   * with the id of the area to be updated. An object with the data to be updated must go in
   * the body.
   *
   * @summary Update areas for the given application's id
   * @throws FetchError<400, types.PutApplicationAreasResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PutApplicationAreasResponse401> Invalid credentials
   * @throws FetchError<403, types.PutApplicationAreasResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PutApplicationAreasResponse404> Application not found
   * @throws FetchError<500, types.PutApplicationAreasResponse500> Server error
   */
  putApplicationAreas(body: types.PutApplicationAreasBodyParam, metadata: types.PutApplicationAreasMetadataParam): Promise<FetchResponse<200, types.PutApplicationAreasResponse200>> {
    return this.core.fetch('/application/{id}/areas', 'put', body, metadata);
  }

  /**
   * Adds logo to an application. La imagen debe tener canal Alpha. 
   * The image must have Alpha channel.If there is no monochrome image for the application,
   * it will be saved as the logo.
   * These types are valid:
   * 'image/jpeg', 'image/png'
   *
   *
   * @summary Add image for the given application's id
   * @throws FetchError<400, types.PostApplicationImageResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostApplicationImageResponse401> Invalid credentials
   * @throws FetchError<403, types.PostApplicationImageResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PostApplicationImageResponse404> Application not found
   * @throws FetchError<500, types.PostApplicationImageResponse500> Server error
   */
  postApplicationImage(body: types.PostApplicationImageBodyParam, metadata: types.PostApplicationImageMetadataParam): Promise<FetchResponse<200, types.PostApplicationImageResponse200>> {
    return this.core.fetch('/application/{id}/image', 'post', body, metadata);
  }

  /**
   * Adds certificate files to an application.
   *
   * @summary Add certificates files for the given application's id
   * @throws FetchError<400, types.PostApplicationCertsResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostApplicationCertsResponse401> Invalid credentials
   * @throws FetchError<403, types.PostApplicationCertsResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PostApplicationCertsResponse404> Application not found
   * @throws FetchError<460, types.PostApplicationCertsResponse460> Invalid certificate credentials or invalid certificate
   * @throws FetchError<500, types.PostApplicationCertsResponse500> Server error
   */
  postApplicationCerts(body: types.PostApplicationCertsBodyParam, metadata: types.PostApplicationCertsMetadataParam): Promise<FetchResponse<200, types.PostApplicationCertsResponse200>>;
  postApplicationCerts(metadata: types.PostApplicationCertsMetadataParam): Promise<FetchResponse<200, types.PostApplicationCertsResponse200>>;
  postApplicationCerts(body?: types.PostApplicationCertsBodyParam | types.PostApplicationCertsMetadataParam, metadata?: types.PostApplicationCertsMetadataParam): Promise<FetchResponse<200, types.PostApplicationCertsResponse200>> {
    return this.core.fetch('/application/{id}/certs', 'post', body, metadata);
  }

  /**
   * List of statistics for the selected application. 
   * Return the number of web devices (_chrome, safari, ..._) that the application has
   * registered, the number of mobile devices (_android and ios_) and the number of automated
   * campaigns for the application (_numEnabledAutomaticCampaigns_).
   *
   * @summary Show general statistics for the given application's id
   * @throws FetchError<400, types.GetApplicationStatsResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetApplicationStatsResponse401> Invalid credentials
   * @throws FetchError<403, types.GetApplicationStatsResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetApplicationStatsResponse404> Application not found
   * @throws FetchError<500, types.GetApplicationStatsResponse500> Server error
   */
  getApplicationStats(metadata: types.GetApplicationStatsMetadataParam): Promise<FetchResponse<200, types.GetApplicationStatsResponse200>> {
    return this.core.fetch('/application/{id}/stats', 'get', metadata);
  }

  /**
   * List of statistics for the selected application, filtered between the dates given.
   *
   * categoryId or find fields cannot be used with hourly periodicity.
   *
   * @summary Show the statistics for the given application's id between two dates
   * @throws FetchError<400, types.GetApplicationDateStatsResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetApplicationDateStatsResponse401> Invalid credentials
   * @throws FetchError<403, types.GetApplicationDateStatsResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetApplicationDateStatsResponse404> Application not found
   * @throws FetchError<500, types.GetApplicationDateStatsResponse500> Server error
   */
  getApplicationDateStats(metadata: types.GetApplicationDateStatsMetadataParam): Promise<FetchResponse<200, types.GetApplicationDateStatsResponse200>> {
    return this.core.fetch('/application/{id}/dateStats', 'get', metadata);
  }

  /**
   * Show general statistics from chat service.
   *
   *
   * @summary General statistics from chats service
   * @throws FetchError<400, types.GetChatDateStatsResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetChatDateStatsResponse401> Invalid credentials
   * @throws FetchError<403, types.GetChatDateStatsResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetChatDateStatsResponse404> Application not found
   * @throws FetchError<500, types.GetChatDateStatsResponse500> Server error
   */
  getChatDateStats(metadata: types.GetChatDateStatsMetadataParam): Promise<FetchResponse<200, types.GetChatDateStatsResponse200>> {
    return this.core.fetch('/application/{id}/dateStats/chat', 'get', metadata);
  }

  /**
   * List of statistics for the selected application, filtered between the dates given. The
   * difference in days of the selected dates can not be greater than 7 (one week)
   *
   * @summary Show the statistics for the given application's id between two dates in a .csv file
   * @throws FetchError<400, types.GetApplicationDateStatsCsvResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetApplicationDateStatsCsvResponse401> Invalid credentials
   * @throws FetchError<403, types.GetApplicationDateStatsCsvResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetApplicationDateStatsCsvResponse404> Application not found
   * @throws FetchError<500, types.GetApplicationDateStatsCsvResponse500> Server error
   */
  getApplicationDateStatsCSV(metadata: types.GetApplicationDateStatsCsvMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/application/{id}/dateStats/csv', 'get', metadata);
  }

  /**
   * Returns statistical data of the applications belonging to an account.
   *
   * @summary Returns statistical data of the applications belonging to an account
   * @throws FetchError<400, types.GetApplicationStatsByAccountResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetApplicationStatsByAccountResponse401> Invalid credentials
   * @throws FetchError<403, types.GetApplicationStatsByAccountResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetApplicationStatsByAccountResponse404> Application not found
   * @throws FetchError<500, types.GetApplicationStatsByAccountResponse500> Server error
   */
  getApplicationStatsByAccount(metadata: types.GetApplicationStatsByAccountMetadataParam): Promise<FetchResponse<200, types.GetApplicationStatsByAccountResponse200>> {
    return this.core.fetch('/application/stats', 'get', metadata);
  }

  /**
   * Add areas from csv to an application. this end point consumes multipart/form-data.
   *
   * @summary Add areas from csv for the given application's id
   * @throws FetchError<400, types.PostApplicationAreasCsvResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostApplicationAreasCsvResponse401> Invalid credentials
   * @throws FetchError<403, types.PostApplicationAreasCsvResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PostApplicationAreasCsvResponse404> Application not found
   * @throws FetchError<500, types.PostApplicationAreasCsvResponse500> Server error
   */
  postApplicationAreasCSV(body: types.PostApplicationAreasCsvBodyParam, metadata: types.PostApplicationAreasCsvMetadataParam): Promise<FetchResponse<200, types.PostApplicationAreasCsvResponse200>> {
    return this.core.fetch('/application/{id}/areas/csv', 'post', body, metadata);
  }

  /**
   * Delete areas from csv to an application.  this end point consumes multipart/form-data.
   *
   * @summary Delete areas from csv for the given application's id
   * @throws FetchError<400, types.DeleteApplicationAreasCsvResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.DeleteApplicationAreasCsvResponse401> Invalid credentials
   * @throws FetchError<403, types.DeleteApplicationAreasCsvResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.DeleteApplicationAreasCsvResponse404> Application not found
   * @throws FetchError<500, types.DeleteApplicationAreasCsvResponse500> Server error
   */
  deleteApplicationAreasCSV(body: types.DeleteApplicationAreasCsvBodyParam, metadata: types.DeleteApplicationAreasCsvMetadataParam): Promise<FetchResponse<200, types.DeleteApplicationAreasCsvResponse200>> {
    return this.core.fetch('/application/{id}/areas/csv', 'delete', body, metadata);
  }

  /**
   * List areas of application in format CSV.
   *
   * @summary Show areas for the given application's id in CSV file
   * @throws FetchError<400, types.GetApplicationAreasCsvResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetApplicationAreasCsvResponse401> Invalid credentials
   * @throws FetchError<403, types.GetApplicationAreasCsvResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetApplicationAreasCsvResponse404> Application not found
   * @throws FetchError<500, types.GetApplicationAreasCsvResponse500> Server error
   */
  getApplicationAreasCSV(metadata: types.GetApplicationAreasCsvMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/application/{id}/areas/csv', 'get', metadata);
  }

  /**
   * Adds devices to a specific topic. Retuns a counter with the number of new added items
   * and errors.
   *
   * @summary Create device for Topic with csv for the given application's id
   * @throws FetchError<400, types.PostApplicationTopicDevicesCsvResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostApplicationTopicDevicesCsvResponse401> Invalid credentials
   * @throws FetchError<403, types.PostApplicationTopicDevicesCsvResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PostApplicationTopicDevicesCsvResponse404> Application not found
   * @throws FetchError<409, types.PostApplicationTopicDevicesCsvResponse409> Topic code already exists
   * @throws FetchError<500, types.PostApplicationTopicDevicesCsvResponse500> Server error
   */
  postApplicationTopicDevicesCsv(body: types.PostApplicationTopicDevicesCsvBodyParam, metadata: types.PostApplicationTopicDevicesCsvMetadataParam): Promise<FetchResponse<201, types.PostApplicationTopicDevicesCsvResponse201>> {
    return this.core.fetch('/application/{id}/topics/csv', 'post', body, metadata);
  }

  /**
   * Download topic's devices for the given application's id, creating a .csv file with all
   * codes of the devices and external Ids. Includes a header.
   *
   * @summary Download a CSV file with devices codes and external Ids
   * @throws FetchError<400, types.GetApplicationTopicDevicesCsvResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetApplicationTopicDevicesCsvResponse401> Invalid credentials
   * @throws FetchError<403, types.GetApplicationTopicDevicesCsvResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetApplicationTopicDevicesCsvResponse404> Application not found
   * @throws FetchError<500, types.GetApplicationTopicDevicesCsvResponse500> Server error
   */
  getApplicationTopicDevicesCsv(metadata: types.GetApplicationTopicDevicesCsvMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/application/{id}/topics/csv', 'get', metadata);
  }

  /**
   * Delete topic's devices from a .csv file. the .csv file contains a code list to devices
   * to an application. Includes a header
   *
   * @summary Delete topic devices from csv
   * @throws FetchError<400, types.DeleteApplicationTopicDevicesCsvResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.DeleteApplicationTopicDevicesCsvResponse401> Invalid credentials
   * @throws FetchError<403, types.DeleteApplicationTopicDevicesCsvResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.DeleteApplicationTopicDevicesCsvResponse404> Application not found
   * @throws FetchError<500, types.DeleteApplicationTopicDevicesCsvResponse500> Server error
   */
  deleteApplicationTopicDevicesCSV(body: types.DeleteApplicationTopicDevicesCsvBodyParam, metadata: types.DeleteApplicationTopicDevicesCsvMetadataParam): Promise<FetchResponse<200, types.DeleteApplicationTopicDevicesCsvResponse200>> {
    return this.core.fetch('/application/{id}/topics/csv', 'delete', body, metadata);
  }

  /**
   * Get topic's devices for the given application's id
   *
   * @summary Obtain list with devices codes
   * @throws FetchError<400, types.GetApplicationTopicDevicesListResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetApplicationTopicDevicesListResponse401> Invalid credentials
   * @throws FetchError<403, types.GetApplicationTopicDevicesListResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetApplicationTopicDevicesListResponse404> Application not found
   * @throws FetchError<500, types.GetApplicationTopicDevicesListResponse500> Server error
   */
  getApplicationTopicDevicesList(metadata: types.GetApplicationTopicDevicesListMetadataParam): Promise<FetchResponse<200, types.GetApplicationTopicDevicesListResponse200>> {
    return this.core.fetch('/application/{id}/topics/list', 'get', metadata);
  }

  /**
   * Get topic's devices for the given application's id
   *
   * @summary Obtain list with devices codes
   * @throws FetchError<400, types.PostApplicationTopicDevicesListResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostApplicationTopicDevicesListResponse401> Invalid credentials
   * @throws FetchError<403, types.PostApplicationTopicDevicesListResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PostApplicationTopicDevicesListResponse404> Application not found
   * @throws FetchError<500, types.PostApplicationTopicDevicesListResponse500> Server error
   */
  postApplicationTopicDevicesList(body: types.PostApplicationTopicDevicesListBodyParam, metadata: types.PostApplicationTopicDevicesListMetadataParam): Promise<FetchResponse<201, types.PostApplicationTopicDevicesListResponse201>> {
    return this.core.fetch('/application/{id}/topics/list', 'post', body, metadata);
  }

  /**
   * Remove the association between device and topic.
   *
   * @summary Delete device topic association
   * @throws FetchError<400, types.DeleteApplicationTopicDevicesListResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.DeleteApplicationTopicDevicesListResponse401> Invalid credentials
   * @throws FetchError<403, types.DeleteApplicationTopicDevicesListResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.DeleteApplicationTopicDevicesListResponse404> Application not found
   * @throws FetchError<500, types.DeleteApplicationTopicDevicesListResponse500> Server error
   */
  deleteApplicationTopicDevicesList(body: types.DeleteApplicationTopicDevicesListBodyParam, metadata: types.DeleteApplicationTopicDevicesListMetadataParam): Promise<FetchResponse<200, types.DeleteApplicationTopicDevicesListResponse200>> {
    return this.core.fetch('/application/{id}/topics/list', 'delete', body, metadata);
  }

  /**
   * Remove the association between device and topic.
   *
   * @summary Delete device topic association
   * @throws FetchError<400, types.DeleteDeviceTopicResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.DeleteDeviceTopicResponse401> Invalid credentials
   * @throws FetchError<403, types.DeleteDeviceTopicResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.DeleteDeviceTopicResponse404> Application not found
   * @throws FetchError<500, types.DeleteDeviceTopicResponse500> Server error
   */
  deleteDeviceTopic(metadata: types.DeleteDeviceTopicMetadataParam): Promise<FetchResponse<200, types.DeleteDeviceTopicResponse200>> {
    return this.core.fetch('/application/{id}/topics/devices', 'delete', metadata);
  }

  /**
   * List of tags for the selected application area. 
   * By query string you can pass parameters through which you can filter the total of areas
   * that are displayed per page, by default 100 (limit), the page that is displayed, by
   * default 0 (page) and we can filter by tag name (find ). 
   * Returns an array of objects, which contains the label and the tag's number of areas.
   *
   * @summary Show areas for the given application's id
   * @throws FetchError<400, types.GetAreaTagResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetAreaTagResponse401> Invalid credentials
   * @throws FetchError<403, types.GetAreaTagResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetAreaTagResponse404> Application not found
   * @throws FetchError<500, types.GetAreaTagResponse500> Server error
   */
  getAreaTag(metadata: types.GetAreaTagMetadataParam): Promise<FetchResponse<200, types.GetAreaTagResponse200>> {
    return this.core.fetch('/application/{id}/areaTag', 'get', metadata);
  }

  /**
   * Status and configuration of a chat service associated with an application.
   *
   *
   * @summary Status and configuration of a chat service associated with an application
   * @throws FetchError<400, types.GetChatResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetChatResponse401> Invalid credentials
   * @throws FetchError<500, types.GetChatResponse500> Server error
   */
  getChat(metadata: types.GetChatMetadataParam): Promise<FetchResponse<200, types.GetChatResponse200>> {
    return this.core.fetch('/application/{id}/chat', 'get', metadata);
  }

  /**
   * Set the configuration of a chat service associated with an application.
   *
   *
   * @summary Set the configuration of a chat service associated with an application
   * @throws FetchError<400, types.PutChatResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PutChatResponse401> Invalid credentials
   * @throws FetchError<460, types.PutChatResponse460> Chat feature is not enabled in this account
   * @throws FetchError<500, types.PutChatResponse500> Server error
   */
  putChat(body: types.PutChatBodyParam, metadata: types.PutChatMetadataParam): Promise<FetchResponse<200, types.PutChatResponse200>> {
    return this.core.fetch('/application/{id}/chat', 'put', body, metadata);
  }

  /**
   * Weekday, weekday and hour push success values of a specific application to display this
   * info with a heatmap and charts.
   *
   * @summary Weekday, weekday and hour push success values of a specific application.
   * @throws FetchError<400, types.GetPushHeatmapResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetPushHeatmapResponse401> Invalid credentials
   * @throws FetchError<403, types.GetPushHeatmapResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetPushHeatmapResponse404> Application not found
   * @throws FetchError<500, types.GetPushHeatmapResponse500> Server error
   */
  getPushHeatmap(metadata: types.GetPushHeatmapMetadataParam): Promise<FetchResponse<200, types.GetPushHeatmapResponse200>> {
    return this.core.fetch('/application/{id}/pushHeatmap', 'get', metadata);
  }

  /**
   * Weekday, weekday and hour push success values of a specific application and for a given
   * timezone to display this info with a heatmap and charts.
   *
   * @summary Weekday, weekday and hour push success values of a specific application.
   * @throws FetchError<400, types.PostPushHeatmapResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostPushHeatmapResponse401> Invalid credentials
   * @throws FetchError<403, types.PostPushHeatmapResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PostPushHeatmapResponse404> Application not found
   * @throws FetchError<500, types.PostPushHeatmapResponse500> Server error
   */
  postPushHeatmap(body: types.PostPushHeatmapBodyParam, metadata: types.PostPushHeatmapMetadataParam): Promise<FetchResponse<200, types.PostPushHeatmapResponse200>> {
    return this.core.fetch('/application/{id}/pushHeatmap', 'post', body, metadata);
  }

  /**
   * Weekday, weekday and hour push success values of a specific application and for a given
   * timezone to display this info with a heatmap and charts.
   *
   * @summary Weekday, weekday and hour push success values of a specific application.
   * @throws FetchError<400, types.PostOmniHeatmapResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostOmniHeatmapResponse401> Invalid credentials
   * @throws FetchError<403, types.PostOmniHeatmapResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PostOmniHeatmapResponse404> Application not found
   * @throws FetchError<500, types.PostOmniHeatmapResponse500> Server error
   */
  postOmniHeatmap(body: types.PostOmniHeatmapBodyParam, metadata: types.PostOmniHeatmapMetadataParam): Promise<FetchResponse<200, types.PostOmniHeatmapResponse200>> {
    return this.core.fetch('/application/{id}/omniHeatmap', 'post', body, metadata);
  }

  /**
   * Words success values in push notifications to display in a word cloud.
   *
   * @summary Words success values of a specific application in push notifications.
   * @throws FetchError<400, types.GetWordCloudResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetWordCloudResponse401> Invalid credentials
   * @throws FetchError<403, types.GetWordCloudResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetWordCloudResponse404> Application not found
   * @throws FetchError<500, types.GetWordCloudResponse500> Server error
   */
  getWordCloud(metadata: types.GetWordCloudMetadataParam): Promise<FetchResponse<200, types.GetWordCloudResponse200>> {
    return this.core.fetch('/application/{id}/wordCloud', 'get', metadata);
  }

  /**
   * Words success values of a specific application in any or all channels.
   *
   * @summary Words success values of a specific application in any or all channels.
   * @throws FetchError<400, types.GetOmniWordCloudResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetOmniWordCloudResponse401> Invalid credentials
   * @throws FetchError<403, types.GetOmniWordCloudResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetOmniWordCloudResponse404> Application not found
   * @throws FetchError<500, types.GetOmniWordCloudResponse500> Server error
   */
  getOmniWordCloud(metadata: types.GetOmniWordCloudMetadataParam): Promise<FetchResponse<200, types.GetOmniWordCloudResponse200>> {
    return this.core.fetch('/application/{id}/omniWordCloud', 'get', metadata);
  }

  /**
   * Get external auth data for external login.
   *
   * @summary Get external auth data for external login.
   * @throws FetchError<400, types.GetExternalAuthResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetExternalAuthResponse401> Invalid credentials
   * @throws FetchError<403, types.GetExternalAuthResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetExternalAuthResponse404> Application not found
   * @throws FetchError<500, types.GetExternalAuthResponse500> Server error
   */
  getExternalAuth(metadata: types.GetExternalAuthMetadataParam): Promise<FetchResponse<200, types.GetExternalAuthResponse200>> {
    return this.core.fetch('/application/{id}/externalAuth', 'get', metadata);
  }

  /**
   * Create external auth data and config for external login.
   *
   * @summary Create external auth.
   * @throws FetchError<400, types.PostExternalAuthResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostExternalAuthResponse401> Invalid credentials
   * @throws FetchError<403, types.PostExternalAuthResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PostExternalAuthResponse404> Application not found
   * @throws FetchError<500, types.PostExternalAuthResponse500> Server error
   */
  postExternalAuth(body: types.PostExternalAuthBodyParam, metadata: types.PostExternalAuthMetadataParam): Promise<FetchResponse<200, types.PostExternalAuthResponse200>> {
    return this.core.fetch('/application/{id}/externalAuth', 'post', body, metadata);
  }

  /**
   * Edit external auth data and config.
   *
   * @summary Edit external auth config.
   * @throws FetchError<400, types.PutExternalAuthResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PutExternalAuthResponse401> Invalid credentials
   * @throws FetchError<403, types.PutExternalAuthResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PutExternalAuthResponse404> Application not found
   * @throws FetchError<500, types.PutExternalAuthResponse500> Server error
   */
  putExternalAuth(body: types.PutExternalAuthBodyParam, metadata: types.PutExternalAuthMetadataParam): Promise<FetchResponse<200, types.PutExternalAuthResponse200>>;
  putExternalAuth(metadata: types.PutExternalAuthMetadataParam): Promise<FetchResponse<200, types.PutExternalAuthResponse200>>;
  putExternalAuth(body?: types.PutExternalAuthBodyParam | types.PutExternalAuthMetadataParam, metadata?: types.PutExternalAuthMetadataParam): Promise<FetchResponse<200, types.PutExternalAuthResponse200>> {
    return this.core.fetch('/application/{id}/externalAuth', 'put', body, metadata);
  }

  /**
   * Remove external auth by application id.
   *
   * @summary Delete external auth
   * @throws FetchError<400, types.DeleteExternalAuthResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.DeleteExternalAuthResponse401> Invalid credentials
   * @throws FetchError<403, types.DeleteExternalAuthResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.DeleteExternalAuthResponse404> Application not found
   * @throws FetchError<500, types.DeleteExternalAuthResponse500> Server error
   */
  deleteExternalAuth(metadata: types.DeleteExternalAuthMetadataParam): Promise<FetchResponse<200, types.DeleteExternalAuthResponse200>> {
    return this.core.fetch('/application/{id}/externalAuth', 'delete', metadata);
  }

  /**
   * Number of devices in each segment of the specified segmentation type for the specified
   * applicationId.
   *
   * @summary Number of devices in each segment of the specified segmentation type for the specified
   * applicationId.
   * @throws FetchError<400, types.GetSegmentationStatsResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetSegmentationStatsResponse401> Invalid credentials
   * @throws FetchError<403, types.GetSegmentationStatsResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetSegmentationStatsResponse404> Application not found
   * @throws FetchError<500, types.GetSegmentationStatsResponse500> Server error
   * @throws FetchError<503, types.GetSegmentationStatsResponse503> Service unavailable
   */
  getSegmentationStats(metadata: types.GetSegmentationStatsMetadataParam): Promise<FetchResponse<200, types.GetSegmentationStatsResponse200>> {
    return this.core.fetch('/application/{id}/segmentationStats/{segmentType}', 'get', metadata);
  }

  /**
   * Return a list of dates that have csv files with push statistics.
   *
   * @summary Get a list of dates that have files with statistics.
   * @throws FetchError<400, types.GetListOfReportsResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetListOfReportsResponse401> Invalid credentials
   * @throws FetchError<403, types.GetListOfReportsResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetListOfReportsResponse404> Application not found
   * @throws FetchError<500, types.GetListOfReportsResponse500> Server error
   * @throws FetchError<503, types.GetListOfReportsResponse503> Service unavailable
   */
  getListOfReports(metadata: types.GetListOfReportsMetadataParam): Promise<FetchResponse<200, types.GetListOfReportsResponse200>> {
    return this.core.fetch('/application/{id}/stats/list', 'get', metadata);
  }

  /**
   * Returns a csv file with one day's push statistics.
   *
   * @summary Obtain file with one day's statistics.
   * @throws FetchError<400, types.GetStatsFileByDateResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetStatsFileByDateResponse401> Invalid credentials
   * @throws FetchError<500, types.GetStatsFileByDateResponse500> Server error
   */
  getStatsFileByDate(metadata: types.GetStatsFileByDateMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/application/{id}/stats/file', 'get', metadata);
  }

  /**
   * Create a campaign for a specific application. The user must have permissions to create
   * campaigns in that application
   *
   * @summary Create a campaign in application
   * @throws FetchError<400, types.PostCampaignResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostCampaignResponse401> Invalid credentials
   * @throws FetchError<403, types.PostCampaignResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PostCampaignResponse404> Application not found
   * @throws FetchError<500, types.PostCampaignResponse500> Server error
   */
  postCampaign(body: types.PostCampaignBodyParam): Promise<FetchResponse<201, types.PostCampaignResponse201>> {
    return this.core.fetch('/campaign', 'post', body);
  }

  /**
   * Shows the list of campaigns for an application.
   * The parameters `limit` (number of items to display per page, max: 100),` page` (number
   * of the page shown, min: 0) and aplicationId (application id) are required. To filter you
   * can use the parameters `find` (to find the name of the campaign),` enabled` (state of
   * the campaign), `triggerCode` (welcome, fidelity, goefencing, custom, network),`
   * platform` (platform type: ios, android, webpush ...), scheduled (search campaign
   * scheduled, pending to send).
   * To order you can use the parameter `orderBy` (Name A-Z, Name Z-A, Date ascending, Date
   * descending)
   *
   * @summary Show campaign list for a given application's id
   * @throws FetchError<400, types.GetCampaignResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetCampaignResponse401> Invalid credentials
   * @throws FetchError<403, types.GetCampaignResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetCampaignResponse404> Application not found
   * @throws FetchError<500, types.GetCampaignResponse500> Server error
   */
  getCampaign(metadata: types.GetCampaignMetadataParam): Promise<FetchResponse<200, types.GetCampaignResponse200>> {
    return this.core.fetch('/campaign', 'get', metadata);
  }

  /**
   * Adds image to a campaign. These types are valid:
   * 'image/jpeg', 'image/gif', 'image/png'. Image aspect ratio should be 2:1. If not,
   * autocrop of image's center will be done.
   * You can select the type of crop (`cropType` - 0 -> 512 x 256, 1 -> 512 x 512) and a
   * specific platform ( `platform` - ios, android, webpush, safari)  for which the image
   * will be used.  In the case of a gif image, which is composed of 3 frames, you can select
   * the frame that will be used as a preview with the parameter `defaultImg`.
   *
   *
   * @summary Add a picture to the given campaign's id
   * @throws FetchError<400, types.PostCampaignImageResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostCampaignImageResponse401> Invalid credentials
   * @throws FetchError<403, types.PostCampaignImageResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PostCampaignImageResponse404> Campaign not found
   * @throws FetchError<500, types.PostCampaignImageResponse500> Server error
   */
  postCampaignImage(body: types.PostCampaignImageBodyParam, metadata: types.PostCampaignImageMetadataParam): Promise<FetchResponse<200, types.PostCampaignImageResponse200>> {
    return this.core.fetch('/campaign/{id}/image', 'post', body, metadata);
  }

  /**
   * Adds a wallet file (pkpass) to a campaign. These types are valid:
   * 'application/vnd.apple.pkpass'
   *
   * The action indicated by parameter (buttonLabel) is verified to be of wallet type.
   *
   *
   * @summary Add a wallet file (pkpass) to the given campaign's id
   * @throws FetchError<400, types.PostCampaignWalletResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostCampaignWalletResponse401> Invalid credentials
   * @throws FetchError<403, types.PostCampaignWalletResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PostCampaignWalletResponse404> Campaign not found
   * @throws FetchError<500, types.PostCampaignWalletResponse500> Server error
   */
  postCampaignWallet(body: types.PostCampaignWalletBodyParam, metadata: types.PostCampaignWalletMetadataParam): Promise<FetchResponse<200, types.PostCampaignWalletResponse200>> {
    return this.core.fetch('/campaign/{id}/wallet', 'post', body, metadata);
  }

  /**
   * Upload a video to be used in a campaign. These types are valid:
   * application/vnd.ms-asf, video/x-msvideo, video/x-flv, video/webm, video/x-m4v,
   * video/mp4, video/mpeg, video/ogg, video/x-matroska.
   *
   * Videos are stored internally in a temporary directory, and those that have not been used
   * in a campaign are periodically deleted.
   *
   *
   * @summary Upload a video to be used in a campaign
   * @throws FetchError<400, types.PostCampaignVideoResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostCampaignVideoResponse401> Invalid credentials
   * @throws FetchError<403, types.PostCampaignVideoResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PostCampaignVideoResponse404> Campaign not found
   * @throws FetchError<500, types.PostCampaignVideoResponse500> Server error
   */
  postCampaignVideo(body: types.PostCampaignVideoBodyParam): Promise<FetchResponse<200, types.PostCampaignVideoResponse200>> {
    return this.core.fetch('/campaign/video', 'post', body);
  }

  /**
   * Adds icon to an application. These types are valid:
   * 'image/jpeg', 'image/png'. Image aspect ratio should be 1:1. If not, autocrop of image's
   * center will be done.
   *
   *
   * @summary Add an icon to the given campaign's id
   * @throws FetchError<400, types.PostCampaignIconResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostCampaignIconResponse401> Invalid credentials
   * @throws FetchError<403, types.PostCampaignIconResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PostCampaignIconResponse404> Campaign not found
   * @throws FetchError<500, types.PostCampaignIconResponse500> Server error
   */
  postCampaignIcon(body: types.PostCampaignIconBodyParam, metadata: types.PostCampaignIconMetadataParam): Promise<FetchResponse<200, types.PostCampaignIconResponse200>> {
    return this.core.fetch('/campaign/{id}/icon', 'post', body, metadata);
  }

  /**
   * Sets a list of target devices for the campaign from a .csv file. The format of the .csv
   * file must be one device code per line.
   *
   * @summary Set a list of target devices for campaign
   * @throws FetchError<400, types.PostCampaignTargetsResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostCampaignTargetsResponse401> Invalid credentials
   * @throws FetchError<403, types.PostCampaignTargetsResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PostCampaignTargetsResponse404> Campaign not found
   * @throws FetchError<500, types.PostCampaignTargetsResponse500> Server error
   */
  postCampaignTargets(body: types.PostCampaignTargetsBodyParam, metadata: types.PostCampaignTargetsMetadataParam): Promise<FetchResponse<200, types.PostCampaignTargetsResponse200>> {
    return this.core.fetch('/campaign/{id}/targets', 'post', body, metadata);
  }

  /**
   * Shows the data of the selected campaign.
   *
   * @summary Show campaign with the given campaign's id
   * @throws FetchError<400, types.GetSingleCampaignResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetSingleCampaignResponse401> Invalid credentials
   * @throws FetchError<403, types.GetSingleCampaignResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetSingleCampaignResponse404> Campaign not found
   * @throws FetchError<500, types.GetSingleCampaignResponse500> Server error
   */
  getSingleCampaign(metadata: types.GetSingleCampaignMetadataParam): Promise<FetchResponse<200, types.GetSingleCampaignResponse200>> {
    return this.core.fetch('/campaign/{id}', 'get', metadata);
  }

  /**
   * Update campaign with the given campaign's id. The variables to be modified are passed
   * through the body.
   *
   * @summary Update campaign with the given campaign's id
   * @throws FetchError<400, types.PutCampaignResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PutCampaignResponse401> Invalid credentials
   * @throws FetchError<403, types.PutCampaignResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PutCampaignResponse404> Campaign not found
   * @throws FetchError<500, types.PutCampaignResponse500> Server error
   */
  putCampaign(body: types.PutCampaignBodyParam, metadata: types.PutCampaignMetadataParam): Promise<FetchResponse<200, types.PutCampaignResponse200>> {
    return this.core.fetch('/campaign/{id}', 'put', body, metadata);
  }

  /**
   * Deletes the selected campaign.
   *
   * @summary Delete a campaign with the given campaign's id
   * @throws FetchError<400, types.DeleteCampaignResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.DeleteCampaignResponse401> Invalid credentials
   * @throws FetchError<403, types.DeleteCampaignResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.DeleteCampaignResponse404> Campaign not found
   * @throws FetchError<500, types.DeleteCampaignResponse500> Server error
   */
  deleteCampaign(metadata: types.DeleteCampaignMetadataParam): Promise<FetchResponse<200, types.DeleteCampaignResponse200>> {
    return this.core.fetch('/campaign/{id}', 'delete', metadata);
  }

  /**
   * Validates if any of the URLS in the campaign have been sent in any of the last 100
   * campaigns
   *
   * @summary Check if any of the campaign urls have been previously sent
   * @throws FetchError<400, types.ValidatesUrlUsedResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.ValidatesUrlUsedResponse401> Invalid credentials
   * @throws FetchError<403, types.ValidatesUrlUsedResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.ValidatesUrlUsedResponse404> Campaign not found
   * @throws FetchError<500, types.ValidatesUrlUsedResponse500> Server error
   */
  validatesUrlUsed(body: types.ValidatesUrlUsedBodyParam): Promise<FetchResponse<200, types.ValidatesUrlUsedResponse200>> {
    return this.core.fetch('/campaign/validateUrl', 'post', body);
  }

  /**
   * **THIS METHOD IS DEPRECATED, PLEASE USE /send/all OR /send/list ENDPOINTS**
   * ___
   * Prepare the campaign to be sent instantly or when it is decided. Through the body you
   * can schedule the delivery date (**scheduleAt**), send a specific list of devices
   * (**deviceList**) or a group of devices that share the same external code
   * (**externalIds**) and program it according to an event, passing the id of that event
   * (**triggerId**). 
   *
   * If the campaign is of type custom, through the property **deviceCustomList** or
   * **externalCustomList** you can send the data for each device.  
   *
   * The **deviceList**, **deviceCustomList** and **externalCustomList** fields have
   * preference over the data added through a csv with the endpoint
   * [/campaign/{id}/targets](#/campaign/postCampaignTargets)
   *
   *
   * @summary Send the selected campaign
   * @throws FetchError<400, types.PostCampaignSendResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostCampaignSendResponse401> Invalid credentials
   * @throws FetchError<403, types.PostCampaignSendResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PostCampaignSendResponse404> Campaign not found
   * @throws FetchError<500, types.PostCampaignSendResponse500> Server error
   */
  postCampaignSend(body: types.PostCampaignSendBodyParam, metadata: types.PostCampaignSendMetadataParam): Promise<FetchResponse<200, types.PostCampaignSendResponse200>>;
  postCampaignSend(metadata: types.PostCampaignSendMetadataParam): Promise<FetchResponse<200, types.PostCampaignSendResponse200>>;
  postCampaignSend(body?: types.PostCampaignSendBodyParam | types.PostCampaignSendMetadataParam, metadata?: types.PostCampaignSendMetadataParam): Promise<FetchResponse<200, types.PostCampaignSendResponse200>> {
    return this.core.fetch('/campaign/{id}/send', 'post', body, metadata);
  }

  /**
   * Gets a sendings list for a selected campaign. 
   *
   * Sendings are deleted after some time, so it is possible that this endpoint does not
   * return any object if the sending was done some time ago.
   *
   * The parameters **limit** (number of items displayed per page, max: 100) and **page**
   * (number of the selected page, min: 0) are required
   *
   * @summary Show campaign sendings
   * @throws FetchError<400, types.GetCampaignSendResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetCampaignSendResponse401> Invalid credentials
   * @throws FetchError<403, types.GetCampaignSendResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetCampaignSendResponse404> Campaign not found
   * @throws FetchError<500, types.GetCampaignSendResponse500> Server error
   */
  getCampaignSend(metadata: types.GetCampaignSendMetadataParam): Promise<FetchResponse<200, types.GetCampaignSendResponse200>> {
    return this.core.fetch('/campaign/{id}/send', 'get', metadata);
  }

  /**
   * Prepares the campaign to be sent to all devices that match the campaign's filters.
   * It can be sent immediatly or scheduled for a date.
   *
   *
   * @summary Send the selected campaign targeting all devices that match the filters
   * @throws FetchError<400, types.PostCampaignSendAllResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostCampaignSendAllResponse401> Invalid credentials
   * @throws FetchError<403, types.PostCampaignSendAllResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PostCampaignSendAllResponse404> Campaign not found
   * @throws FetchError<500, types.PostCampaignSendAllResponse500> Server error
   */
  postCampaignSendAll(body: types.PostCampaignSendAllBodyParam, metadata: types.PostCampaignSendAllMetadataParam): Promise<FetchResponse<200, types.PostCampaignSendAllResponse200>>;
  postCampaignSendAll(metadata: types.PostCampaignSendAllMetadataParam): Promise<FetchResponse<200, types.PostCampaignSendAllResponse200>>;
  postCampaignSendAll(body?: types.PostCampaignSendAllBodyParam | types.PostCampaignSendAllMetadataParam, metadata?: types.PostCampaignSendAllMetadataParam): Promise<FetchResponse<200, types.PostCampaignSendAllResponse200>> {
    return this.core.fetch('/campaign/{id}/send/all', 'post', body, metadata);
  }

  /**
   * Prepares the campaign to be sent to specified devices applying campaign's filters. 
   *
   * The devices in the list can be refered by its deviceId or externalId, this can be set
   * with idType parameter, which is deviceId by default.
   *
   * ---
   *
   * * Example with deviceId
   * ```
   * {
   *   "idType": "deviceId",
   *   "deviceList" : [
   *     {
   *       "id" : "deviceId1"
   *     },
   *     {
   *       "id": "deviceId2"
   *     }
   *   ]
   * }
   * ``` 
   *
   * * Example with externalId
   * ```
   * {
   *   "idType": "externalId",
   *   "deviceList" : [
   *     {
   *       "id" : "externalId1"
   *     },
   *     {
   *       "id": "externalId2"
   *     }
   *   ]
   * }
   * ``` 
   * ---
   *
   * If the campaign contains customizable fields, those can be included in the list.
   *
   * * Example with customizable fields. Keep in mind that campaign must cointains these
   * fields, in this example, {{myfield1}} and {{myfield2}}
   * ```
   * {
   *   "idType": "deviceId",
   *   "deviceList" : [
   *     {
   *       "id" : "deviceId1"
   *       "customFields": 
   *         { 
   *           "myfield1" : "fieldvalue"
   *           "myfield2" : "fieldvalue"
   *         }
   *     },
   *     {
   *       "id": "deviceId2"
   *       "customFields": 
   *         { 
   *           "myfield1" : "fieldvalue"
   *           "myfield2" : "fieldvalue"
   *         }
   *     }
   *   ]
   * }
   * ```
   *
   *
   * @summary Send the selected campaign targeting the specified devices
   * @throws FetchError<400, types.PostCampaignSendListResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostCampaignSendListResponse401> Invalid credentials
   * @throws FetchError<403, types.PostCampaignSendListResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PostCampaignSendListResponse404> Campaign not found
   * @throws FetchError<500, types.PostCampaignSendListResponse500> Server error
   */
  postCampaignSendList(body: types.PostCampaignSendListBodyParam, metadata: types.PostCampaignSendListMetadataParam): Promise<FetchResponse<200, types.PostCampaignSendListResponse200>> {
    return this.core.fetch('/campaign/{id}/send/list', 'post', body, metadata);
  }

  /**
   * Calculate the number of impacted devices in a campaign. 
   * This is a simulation of the sending of a possible campaign with specific filters.
   * Filters and other parameters are passed through the campaign object
   *
   * @summary Show number of reached devices for campaign
   * @throws FetchError<400, types.PostCampaignImpactsResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostCampaignImpactsResponse401> Invalid credentials
   * @throws FetchError<403, types.PostCampaignImpactsResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PostCampaignImpactsResponse404> Application not found
   * @throws FetchError<500, types.PostCampaignImpactsResponse500> Server error
   */
  postCampaignImpacts(body: types.PostCampaignImpactsBodyParam): Promise<FetchResponse<200, types.PostCampaignImpactsResponse200>> {
    return this.core.fetch('/campaign/impacts', 'post', body);
  }

  /**
   * Gets the text in the title and makes a request to a service that returns a score for
   * that text.
   *
   * @summary Gives a score for the campaign depending on the text in its title.
   * @throws FetchError<400, types.PostCampaignTitleScoreResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostCampaignTitleScoreResponse401> Invalid credentials
   * @throws FetchError<403, types.PostCampaignTitleScoreResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PostCampaignTitleScoreResponse404> Application not found
   * @throws FetchError<500, types.PostCampaignTitleScoreResponse500> Server error
   */
  postCampaignTitleScore(body: types.PostCampaignTitleScoreBodyParam): Promise<FetchResponse<200, types.PostCampaignTitleScoreResponse200>> {
    return this.core.fetch('/campaign/score', 'post', body);
  }

  /**
   * Obtain a list with the statistics of the shipments by campaign for the selected
   * application. 
   * The parameters **applicationId** (application id), **dateFrom** (start date), **dateTo**
   * (end date), **limit** (limit of elements per page) and **page** (page shown) are
   * required . In the answer we can see the selected platform, the number of devices to
   * which it was sent, the ones that received it, how much they clicked.
   *
   * @summary Gets the application's sendings stats
   * @throws FetchError<400, types.GetCampaignStatsResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetCampaignStatsResponse401> Invalid credentials
   * @throws FetchError<403, types.GetCampaignStatsResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetCampaignStatsResponse404> Application not found
   * @throws FetchError<500, types.GetCampaignStatsResponse500> Server error
   */
  getCampaignStats(metadata: types.GetCampaignStatsMetadataParam): Promise<FetchResponse<200, types.GetCampaignStatsResponse200>> {
    return this.core.fetch('/campaign/stats', 'get', metadata);
  }

  /**
   * Obtain a list with the statistics of the shipments by campaign for the selected
   * application. Return a .csv file. 
   * The parameters **applicationId** (application id), **dateFrom** (start date), **dateTo**
   * (end date), **limit** (limit of elements per page) and **page** (page shown) are
   * required . In the answer we can see the selected platform, the number of devices to
   * which it was sent, the ones that received it, how much they clicked.
   *
   *
   * @summary Gets the application's sendings stats in .csv format
   * @throws FetchError<400, types.GetCampaignStatsCsvResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetCampaignStatsCsvResponse401> Invalid credentials
   * @throws FetchError<403, types.GetCampaignStatsCsvResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetCampaignStatsCsvResponse404> Application not found
   * @throws FetchError<500, types.GetCampaignStatsCsvResponse500> Server error
   */
  getCampaignStatsCSV(metadata: types.GetCampaignStatsCsvMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/campaign/stats/csv', 'get', metadata);
  }

  /**
   * List of statistics for the selected campaign, filtered between the dates given.
   *
   * @summary Show the statistics for the given campaign's id between two dates
   * @throws FetchError<400, types.GetCampaignDateStatsResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetCampaignDateStatsResponse401> Invalid credentials
   * @throws FetchError<403, types.GetCampaignDateStatsResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetCampaignDateStatsResponse404> Application not found
   * @throws FetchError<500, types.GetCampaignDateStatsResponse500> Server error
   */
  getCampaignDateStats(metadata: types.GetCampaignDateStatsMetadataParam): Promise<FetchResponse<200, types.GetCampaignDateStatsResponse200>> {
    return this.core.fetch('/campaign/{id}/dateStats', 'get', metadata);
  }

  /**
   * Returns the statistics associated with a campaign
   *
   * It is possible that, depending on the type of sending, the information may be aggregated
   * by sending or by day
   *
   * This endpoint should be used in place of the deprecated `/campaign/{id}/send`
   *
   *
   * @summary Returns the statistics associated with a campaign
   * @throws FetchError<400, types.GetCampaignStatsByIdResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetCampaignStatsByIdResponse401> Invalid credentials
   * @throws FetchError<403, types.GetCampaignStatsByIdResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetCampaignStatsByIdResponse404> Application not found
   * @throws FetchError<500, types.GetCampaignStatsByIdResponse500> Server error
   */
  getCampaignStatsById(metadata: types.GetCampaignStatsByIdMetadataParam): Promise<FetchResponse<200, types.GetCampaignStatsByIdResponse200>> {
    return this.core.fetch('/campaign/{id}/stats', 'get', metadata);
  }

  /**
   * Returns the information associated with a specific campaign stats.
   *
   *
   * @summary Returns the information associated with a specific campaign stats.
   * @throws FetchError<400, types.GetCampaignStatsEntityByIdResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetCampaignStatsEntityByIdResponse401> Invalid credentials
   * @throws FetchError<403, types.GetCampaignStatsEntityByIdResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetCampaignStatsEntityByIdResponse404> Campaign not found
   * @throws FetchError<500, types.GetCampaignStatsEntityByIdResponse500> Server error
   */
  getCampaignStatsEntityById(metadata: types.GetCampaignStatsEntityByIdMetadataParam): Promise<FetchResponse<200, types.GetCampaignStatsEntityByIdResponse200>> {
    return this.core.fetch('/campaignstats/{id}', 'get', metadata);
  }

  /**
   * Returns a list of scheduled sendings for a specific campaign.
   *
   * The parameters **limit** (number of items displayed per page, max: 100) and **page**
   * (number of the selected page, min: 0) are required
   *
   * @summary List of scheduled sendings
   * @throws FetchError<400, types.GetScheduledSendingsResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetScheduledSendingsResponse401> Invalid credentials
   * @throws FetchError<403, types.GetScheduledSendingsResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetScheduledSendingsResponse404> Campaign not found
   * @throws FetchError<500, types.GetScheduledSendingsResponse500> Server error
   */
  getScheduledSendings(metadata: types.GetScheduledSendingsMetadataParam): Promise<FetchResponse<200, types.GetScheduledSendingsResponse200>> {
    return this.core.fetch('/campaign/{id}/scheduled', 'get', metadata);
  }

  /**
   * Obtain information about the selected account. Also get the features of it.
   *
   * @summary Show account with features
   * @throws FetchError<400, types.GetAccountPublicResponse400> Parameters missing or not in right format
   * @throws FetchError<404, types.GetAccountPublicResponse404> Account not found
   * @throws FetchError<500, types.GetAccountPublicResponse500> Server error
   */
  getAccountPublic(metadata: types.GetAccountPublicMetadataParam): Promise<FetchResponse<200, types.GetAccountPublicResponse200>> {
    return this.core.fetch('/account/{id}', 'get', metadata);
  }

  /**
   * Obtain information of  the accounts. Also get the features of it.
   *
   * @summary Show accounts list with her features
   * @throws FetchError<400, types.GetAccountsResponse400> Parameters missing or not in right format
   * @throws FetchError<404, types.GetAccountsResponse404> Account not found
   * @throws FetchError<500, types.GetAccountsResponse500> Server error
   */
  getAccounts(metadata: types.GetAccountsMetadataParam): Promise<FetchResponse<200, types.GetAccountsResponse200>> {
    return this.core.fetch('/account', 'get', metadata);
  }

  /**
   * Obtain information of  the accounts. Also get the features of it.
   *
   * @summary Show accounts list with her features
   * @throws FetchError<400, types.GetAccountLogsResponse400> Parameters missing or not in right format
   * @throws FetchError<404, types.GetAccountLogsResponse404> Account not found
   * @throws FetchError<500, types.GetAccountLogsResponse500> Server error
   */
  getAccountLogs(metadata: types.GetAccountLogsMetadataParam): Promise<FetchResponse<200, types.GetAccountLogsResponse200>> {
    return this.core.fetch('/account/{id}/logs', 'get', metadata);
  }

  /**
   * Gets the server status
   *
   * @summary Gets the Server status
   * @throws FetchError<404, types.CheckResponse404> Application not found
   * @throws FetchError<500, types.CheckResponse500> Server error
   */
  check(): Promise<FetchResponse<200, types.CheckResponse200>> {
    return this.core.fetch('/status', 'get');
  }

  /**
   * Gets the stats for the selected sendign. 
   * Returns the features and statistical data such as the number of devices to what was sent
   * and the amount they clicked on it
   *
   * @summary Gets the sending stats by id
   * @throws FetchError<400, types.GetSendIdStatsResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetSendIdStatsResponse401> Invalid credentials
   * @throws FetchError<403, types.GetSendIdStatsResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetSendIdStatsResponse404> Application not found
   * @throws FetchError<500, types.GetSendIdStatsResponse500> Server error
   */
  getSendIdStats(metadata: types.GetSendIdStatsMetadataParam): Promise<FetchResponse<200, types.GetSendIdStatsResponse200>> {
    return this.core.fetch('/send/{id}/stats', 'get', metadata);
  }

  /**
   * Change the property 'cancelled'  to true by false or false by true  of the selected
   * sending
   *
   * @summary Put the sending state to Cancelled
   * @throws FetchError<400, types.UpdatedSendIdCancelResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.UpdatedSendIdCancelResponse401> Invalid credentials
   * @throws FetchError<403, types.UpdatedSendIdCancelResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.UpdatedSendIdCancelResponse404> Application not found
   * @throws FetchError<500, types.UpdatedSendIdCancelResponse500> Server error
   */
  updatedSendIdCancel(metadata: types.UpdatedSendIdCancelMetadataParam): Promise<FetchResponse<200, types.UpdatedSendIdCancelResponse200>> {
    return this.core.fetch('/send/{id}/cancel', 'put', metadata);
  }

  /**
   * Create a new  A/B testing .The test object must have the name of the test (**name**) and
   * the application's id (**applicationId**) and the filters that will be applied to the
   * campaigns that will form the test (**filters**).
   *
   * @summary add a new A/B testing
   * @throws FetchError<400, types.PostTestResponse400> Parameters missing or not in right format
   * @throws FetchError<404, types.PostTestResponse404> Application or device not found
   * @throws FetchError<500, types.PostTestResponse500> Server error
   */
  postTest(body: types.PostTestBodyParam): Promise<FetchResponse<200, types.PostTestResponse200>> {
    return this.core.fetch('/test', 'post', body);
  }

  /**
   * Get the  A/B testing list for a selected application.
   * The parameters **applicationId**, **limit** (maximum number of tests that will be
   * displayed per page) and **page** (number of the page that will be displayed) are
   * mandatory.  You can also filter by test name (**find**), by the platform (**platform**)
   * and sort them (**orderBy**). 
   * Returns an array with the data of each A/B testing
   *
   * @summary Show  A/B testing list for a given application's id
   * @throws FetchError<400, types.GetTestsResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetTestsResponse401> Invalid credentials
   * @throws FetchError<403, types.GetTestsResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetTestsResponse404> Application not found
   * @throws FetchError<500, types.GetTestsResponse500> Server error
   */
  getTests(metadata: types.GetTestsMetadataParam): Promise<FetchResponse<200, types.GetTestsResponse200>> {
    return this.core.fetch('/test', 'get', metadata);
  }

  /**
   * Gets the data of the selected  A/B testing. 
   * Returns an object with the name of the test, information about the campaigns that
   * comprise it, the winning campaign and the status of the test (_sent or finished_)
   *
   * @summary Show  A/B testing with the given test's id
   * @throws FetchError<400, types.GetTestResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetTestResponse401> Invalid credentials
   * @throws FetchError<403, types.GetTestResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetTestResponse404> Campaign not found
   * @throws FetchError<500, types.GetTestResponse500> Server error
   */
  getTest(metadata: types.GetTestMetadataParam): Promise<FetchResponse<200, types.GetTestResponse200>> {
    return this.core.fetch('/test/{id}', 'get', metadata);
  }

  /**
   * Update the data of the selected A/B testing. The data to be modified is passed through
   * the A/B testing object
   *
   * @summary Update  A/B testing with the given test's id
   * @throws FetchError<400, types.PutTestResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PutTestResponse401> Invalid credentials
   * @throws FetchError<403, types.PutTestResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PutTestResponse404> Campaign not found
   * @throws FetchError<500, types.PutTestResponse500> Server error
   */
  putTest(body: types.PutTestBodyParam, metadata: types.PutTestMetadataParam): Promise<FetchResponse<200, types.PutTestResponse200>> {
    return this.core.fetch('/test/{id}', 'put', body, metadata);
  }

  /**
   * Deletes a selected  A/B testing
   *
   * @summary Delete a  A/B testing with the given test's id
   * @throws FetchError<400, types.DeleteTestResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.DeleteTestResponse401> Invalid credentials
   * @throws FetchError<403, types.DeleteTestResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.DeleteTestResponse404> Campaign not found
   * @throws FetchError<500, types.DeleteTestResponse500> Server error
   */
  deleteTest(metadata: types.DeleteTestMetadataParam): Promise<FetchResponse<200, types.DeleteTestResponse200>> {
    return this.core.fetch('/test/{id}', 'delete', metadata);
  }

  /**
   * Prepare the  A/B testing to be sent instantly or when it is scheduled. 
   * In the sending object we can indicate the sending date (**scheduleAt**). If it is the
   * `first time` we send the  A/B testing, we must pass the parameter **total**, in which we
   * indicate the total number of devices that will receive the  A/B testing, divided equally
   * between the different campaigns that compose it (_can not be less than number of
   * campaigns_). If we already send the  A/B testing and the winning campaign is going to be
   * sent we must pass the parameter **campaignSelected** to which we will pass the id of the
   * selected campaign for the final sending
   *
   * @summary Create  A/B testing to be sent
   * @throws FetchError<400, types.PostTestSendResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostTestSendResponse401> Invalid credentials
   * @throws FetchError<403, types.PostTestSendResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PostTestSendResponse404> Campaign not found
   * @throws FetchError<500, types.PostTestSendResponse500> Server error
   */
  postTestSend(body: types.PostTestSendBodyParam, metadata: types.PostTestSendMetadataParam): Promise<FetchResponse<200, types.PostTestSendResponse200>> {
    return this.core.fetch('/test/{id}/send', 'post', body, metadata);
  }

  /**
   * Shows the statistics of the A/B testing. 
   * Returns the name and other data of the A/B testing's campaigns data, indicating the
   * statistics for each of the this
   *
   * @summary Show  A/B testing stats with the given test's id
   * @throws FetchError<400, types.GetTestStatsResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetTestStatsResponse401> Invalid credentials
   * @throws FetchError<403, types.GetTestStatsResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetTestStatsResponse404> Campaign not found
   * @throws FetchError<500, types.GetTestStatsResponse500> Server error
   */
  getTestStats(metadata: types.GetTestStatsMetadataParam): Promise<FetchResponse<200, types.GetTestStatsResponse200>> {
    return this.core.fetch('/test/{id}/stats', 'get', metadata);
  }

  /**
   * Divides the viewport in a grid of areas and counts the devices inside every grid cell.
   * It returns the point to show on the map and its label with the number of devices. If
   * viewport is a square the grid will be of size x size.
   *
   * @summary Divides the viewport in a grid of areas and counts the devices inside
   * @throws FetchError<400, types.PostHeatmapResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostHeatmapResponse401> Invalid credentials
   * @throws FetchError<403, types.PostHeatmapResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PostHeatmapResponse404> Application not found
   * @throws FetchError<500, types.PostHeatmapResponse500> Server error
   */
  postHeatmap(body: types.PostHeatmapBodyParam, metadata: types.PostHeatmapMetadataParam): Promise<FetchResponse<200, types.PostHeatmapResponse200>> {
    return this.core.fetch('/application/{id}/heatmap', 'post', body, metadata);
  }

  /**
   * Create a Google Analitics Parameter for a specific campaign.
   *
   * @summary Create a analitic Web parameters
   * @throws FetchError<400, types.PostApplicationWebAnalyticResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostApplicationWebAnalyticResponse401> Invalid credentials
   * @throws FetchError<403, types.PostApplicationWebAnalyticResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PostApplicationWebAnalyticResponse404> Application not found
   * @throws FetchError<500, types.PostApplicationWebAnalyticResponse500> Server error
   */
  postApplicationWebAnalytic(body: types.PostApplicationWebAnalyticBodyParam, metadata: types.PostApplicationWebAnalyticMetadataParam): Promise<FetchResponse<201, types.PostApplicationWebAnalyticResponse201>> {
    return this.core.fetch('/application/{id}/webAnalytic', 'post', body, metadata);
  }

  /**
   * Gets the Google Analitic  list for an campaign.
   *
   * @summary Show Google Analitic list for a given campaign's id
   * @throws FetchError<400, types.GetApplicationWebAnalyticResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetApplicationWebAnalyticResponse401> Invalid credentials
   * @throws FetchError<403, types.GetApplicationWebAnalyticResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetApplicationWebAnalyticResponse404> Application not found
   * @throws FetchError<500, types.GetApplicationWebAnalyticResponse500> Server error
   */
  getApplicationWebAnalytic(metadata: types.GetApplicationWebAnalyticMetadataParam): Promise<FetchResponse<200, types.GetApplicationWebAnalyticResponse200>> {
    return this.core.fetch('/application/{id}/webAnalytic', 'get', metadata);
  }

  /**
   * Modifies the data of the selected campaign.
   *
   * @summary Update webAnalytic with the given application's id and 
   * @throws FetchError<400, types.PutApplicationWebAnalyticResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PutApplicationWebAnalyticResponse401> Invalid credentials
   * @throws FetchError<403, types.PutApplicationWebAnalyticResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PutApplicationWebAnalyticResponse404> Campaign not found
   * @throws FetchError<500, types.PutApplicationWebAnalyticResponse500> Server error
   */
  putApplicationWebAnalytic(body: types.PutApplicationWebAnalyticBodyParam, metadata: types.PutApplicationWebAnalyticMetadataParam): Promise<FetchResponse<200, types.PutApplicationWebAnalyticResponse200>> {
    return this.core.fetch('/application/{id}/webAnalytic', 'put', body, metadata);
  }

  /**
   * Deletes the webAnalytic campaign.
   *
   * @summary Delete a web analytic with the given webAnalytic's id
   * @throws FetchError<400, types.DeleteApplicationWebAnalyticResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.DeleteApplicationWebAnalyticResponse401> Invalid credentials
   * @throws FetchError<403, types.DeleteApplicationWebAnalyticResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.DeleteApplicationWebAnalyticResponse404> Campaign not found
   * @throws FetchError<500, types.DeleteApplicationWebAnalyticResponse500> Server error
   */
  deleteApplicationWebAnalytic(body: types.DeleteApplicationWebAnalyticBodyParam, metadata: types.DeleteApplicationWebAnalyticMetadataParam): Promise<FetchResponse<200, types.DeleteApplicationWebAnalyticResponse200>> {
    return this.core.fetch('/application/{id}/webAnalytic', 'delete', body, metadata);
  }

  /**
   * Show statistics for push by devices.  The response is a ___Chunked transfer encoding___
   * (blocks of 20,000 devices). Be sure to make the request correctly.
   * An example code in Node JS:
   *   https://nodejs.org/ja/docs/guides/anatomy-of-an-http-transaction/#request-body
   *
   *
   * @summary Show statistics for push by devices 
   * @throws FetchError<400, types.GetApplicationStatsByDevicesResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetApplicationStatsByDevicesResponse401> Invalid credentials
   * @throws FetchError<403, types.GetApplicationStatsByDevicesResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetApplicationStatsByDevicesResponse404> Campaign not found
   * @throws FetchError<500, types.GetApplicationStatsByDevicesResponse500> Server error
   */
  getApplicationStatsByDevices(metadata: types.GetApplicationStatsByDevicesMetadataParam): Promise<FetchResponse<200, types.GetApplicationStatsByDevicesResponse200>> {
    return this.core.fetch('/application/{id}/stats/device', 'get', metadata);
  }

  /**
   * Download .csv with statistics for push by devices
   *
   * @summary Download .csv with stadistics for push by devices
   * @throws FetchError<400, types.GetApplicationStatsByDevicesCsvResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetApplicationStatsByDevicesCsvResponse401> Invalid credentials
   * @throws FetchError<403, types.GetApplicationStatsByDevicesCsvResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetApplicationStatsByDevicesCsvResponse404> Application not found
   * @throws FetchError<500, types.GetApplicationStatsByDevicesCsvResponse500> Server error
   */
  getApplicationStatsByDevicesCsv(metadata: types.GetApplicationStatsByDevicesCsvMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/application/{id}/stats/device/csv', 'get', metadata);
  }

  /**
   * Show device with push errors in a date range for a given application's id. The response
   * is a ___Chunked transfer encoding___ (blocks of 20,000 devices). Be sure to make the
   * request correctly.
   * An example code in Node JS:
   *   https://nodejs.org/ja/docs/guides/anatomy-of-an-http-transaction/#request-body
   *
   * ---
   * The following error codes are not recoverable and mark a definitive withdrawal of the
   * device:
   *   
   *   * Android devices: InvalidRegistration, NotRegistered, MismatchSenderId
   *   * iOS devices: BadDeviceToken, Unregistered, DeviceTokenNotForTopic
   *   * WebPush: SubscriptionExpired (404), Unsubscribed (410)
   *   * Safari: BadDeviceToken, Unregistered
   *
   *
   * @summary Show device with push errors
   * @throws FetchError<400, types.GetDevicesWithPushErrorResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetDevicesWithPushErrorResponse401> Invalid credentials
   * @throws FetchError<403, types.GetDevicesWithPushErrorResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetDevicesWithPushErrorResponse404> Application not found
   * @throws FetchError<500, types.GetDevicesWithPushErrorResponse500> Server error
   */
  getDevicesWithPushError(metadata: types.GetDevicesWithPushErrorMetadataParam): Promise<FetchResponse<200, types.GetDevicesWithPushErrorResponse200>> {
    return this.core.fetch('/application/{id}/stats/devicePushError', 'get', metadata);
  }

  /**
   * Download .csv file with devices push errors in date range.
   * The following error codes are not recoverable and mark a definitive withdrawal of the
   * device:
   *   
   *   * Android devices: InvalidRegistration, NotRegistered, MismatchSenderId
   *   * iOS devices: BadDeviceToken, Unregistered, DeviceTokenNotForTopic
   *   * WebPush: SubscriptionExpired (404), Unsubscribed (410)
   *   * Safari: BadDeviceToken, Unregistered
   *
   *
   * @summary Download .csv file with devices push errors
   * @throws FetchError<400, types.GetDevicesWithPushErrorCsvResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetDevicesWithPushErrorCsvResponse401> Invalid credentials
   * @throws FetchError<403, types.GetDevicesWithPushErrorCsvResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetDevicesWithPushErrorCsvResponse404> Application not found
   * @throws FetchError<500, types.GetDevicesWithPushErrorCsvResponse500> Server error
   */
  getDevicesWithPushErrorCSV(metadata: types.GetDevicesWithPushErrorCsvMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/application/{id}/stats/devicePushError/csv', 'get', metadata);
  }

  /**
   * Show statistics for chat service.
   * NOTE: The filter channel don't apply in dfMessageStats field.
   * Field activeConversations deprecated, always return 0.
   *
   *
   * @summary Show statistics from chat service
   * @throws FetchError<400, types.GetChatStatsResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetChatStatsResponse401> Invalid credentials
   * @throws FetchError<403, types.GetChatStatsResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetChatStatsResponse404> Application not found
   * @throws FetchError<500, types.GetChatStatsResponse500> Server error
   */
  getChatStats(metadata: types.GetChatStatsMetadataParam): Promise<FetchResponse<200, types.GetChatStatsResponse200>> {
    return this.core.fetch('/application/{id}/stats/chat', 'get', metadata);
  }

  /**
   * Create a new category for a specific application.
   *
   * @summary Create a new category to application
   * @throws FetchError<400, types.PostApplicationCategoryResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostApplicationCategoryResponse401> Invalid credentials
   * @throws FetchError<403, types.PostApplicationCategoryResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PostApplicationCategoryResponse404> Application not found
   * @throws FetchError<409, types.PostApplicationCategoryResponse409> Duplicated code for this application
   * @throws FetchError<500, types.PostApplicationCategoryResponse500> Server error
   */
  postApplicationCategory(body: types.PostApplicationCategoryBodyParam, metadata: types.PostApplicationCategoryMetadataParam): Promise<FetchResponse<201, types.PostApplicationCategoryResponse201>> {
    return this.core.fetch('/application/{id}/category', 'post', body, metadata);
  }

  /**
   * Gets the categories list for an application.
   *
   * @summary Show categories list for a given application's id
   * @throws FetchError<400, types.GetApplicationCategoryResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetApplicationCategoryResponse401> Invalid credentials
   * @throws FetchError<403, types.GetApplicationCategoryResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetApplicationCategoryResponse404> Application not found
   * @throws FetchError<500, types.GetApplicationCategoryResponse500> Server error
   */
  getApplicationCategory(metadata: types.GetApplicationCategoryMetadataParam): Promise<FetchResponse<200, types.GetApplicationCategoryResponse200>> {
    return this.core.fetch('/application/{id}/category', 'get', metadata);
  }

  /**
   * Modifies the data of the category.
   *
   * @summary Update categiry with the given application's id 
   * @throws FetchError<400, types.PutApplicationCategoryResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PutApplicationCategoryResponse401> Invalid credentials
   * @throws FetchError<403, types.PutApplicationCategoryResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PutApplicationCategoryResponse404> Campaign not found
   * @throws FetchError<409, types.PutApplicationCategoryResponse409> Duplicated code for this application
   * @throws FetchError<500, types.PutApplicationCategoryResponse500> Server error
   */
  putApplicationCategory(body: types.PutApplicationCategoryBodyParam, metadata: types.PutApplicationCategoryMetadataParam): Promise<FetchResponse<200, types.PutApplicationCategoryResponse200>> {
    return this.core.fetch('/application/{id}/category', 'put', body, metadata);
  }

  /**
   * Deletes the categories of the application.
   *
   * @summary Delete a category with the given application's id
   * @throws FetchError<400, types.DeleteApplicationCategoryResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.DeleteApplicationCategoryResponse401> Invalid credentials
   * @throws FetchError<403, types.DeleteApplicationCategoryResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.DeleteApplicationCategoryResponse404> Campaign not found
   * @throws FetchError<500, types.DeleteApplicationCategoryResponse500> Server error
   */
  deleteApplicationCategory(body: types.DeleteApplicationCategoryBodyParam, metadata: types.DeleteApplicationCategoryMetadataParam): Promise<FetchResponse<200, types.DeleteApplicationCategoryResponse200>> {
    return this.core.fetch('/application/{id}/category', 'delete', body, metadata);
  }

  /**
   * Create a new inApp schema for a specific application.
   *
   * @summary Create a new inApp Schema
   * @throws FetchError<400, types.PostInAppSchemaResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostInAppSchemaResponse401> Invalid credentials
   * @throws FetchError<403, types.PostInAppSchemaResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PostInAppSchemaResponse404> Application not found
   * @throws FetchError<409, types.PostInAppSchemaResponse409> Duplicated code for this application
   * @throws FetchError<500, types.PostInAppSchemaResponse500> Server error
   */
  postInAppSchema(body: types.PostInAppSchemaBodyParam, metadata: types.PostInAppSchemaMetadataParam): Promise<FetchResponse<201, types.PostInAppSchemaResponse201>> {
    return this.core.fetch('/application/{id}/inAppSchema', 'post', body, metadata);
  }

  /**
   * Gets the inApp schemas list for an application.
   *
   * @summary Show inApp schemas list for a given application's id
   * @throws FetchError<400, types.GetInAppSchemaListResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetInAppSchemaListResponse401> Invalid credentials
   * @throws FetchError<403, types.GetInAppSchemaListResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetInAppSchemaListResponse404> Application not found
   * @throws FetchError<500, types.GetInAppSchemaListResponse500> Server error
   */
  getInAppSchemaList(metadata: types.GetInAppSchemaListMetadataParam): Promise<FetchResponse<200, types.GetInAppSchemaListResponse200>> {
    return this.core.fetch('/application/{id}/inAppSchema', 'get', metadata);
  }

  /**
   * Modifies the data of the inApp schemas.
   *
   * @summary Update categiry with the given application's id 
   * @throws FetchError<400, types.PutInAppSchemaResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PutInAppSchemaResponse401> Invalid credentials
   * @throws FetchError<403, types.PutInAppSchemaResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PutInAppSchemaResponse404> Campaign not found
   * @throws FetchError<409, types.PutInAppSchemaResponse409> Duplicated code for this application
   * @throws FetchError<500, types.PutInAppSchemaResponse500> Server error
   */
  putInAppSchema(body: types.PutInAppSchemaBodyParam, metadata: types.PutInAppSchemaMetadataParam): Promise<FetchResponse<200, types.PutInAppSchemaResponse200>> {
    return this.core.fetch('/application/{id}/inAppSchema', 'put', body, metadata);
  }

  /**
   * Deletes the inApp schemas of the application.
   *
   * @summary Delete a inAppSchemas with the given application's id
   * @throws FetchError<400, types.DeleteInAppSchemaResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.DeleteInAppSchemaResponse401> Invalid credentials
   * @throws FetchError<403, types.DeleteInAppSchemaResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.DeleteInAppSchemaResponse404> Campaign not found
   * @throws FetchError<500, types.DeleteInAppSchemaResponse500> Server error
   */
  deleteInAppSchema(body: types.DeleteInAppSchemaBodyParam, metadata: types.DeleteInAppSchemaMetadataParam): Promise<FetchResponse<200, types.DeleteInAppSchemaResponse200>> {
    return this.core.fetch('/application/{id}/inAppSchema', 'delete', body, metadata);
  }

  /**
   * Return the  information of device list. The maximum device will be 100000 if it is a
   * list given by the user. If a list is not indicated, the system returns all the devices
   * for that application, page the results. The user can choose the number of results and
   * the page to be show.
   *
   *
   * @summary Return the status of devices list
   * @throws FetchError<400, types.PostDeviceStatusResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostDeviceStatusResponse401> Invalid credentials
   * @throws FetchError<403, types.PostDeviceStatusResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PostDeviceStatusResponse404> Application not found
   * @throws FetchError<409, types.PostDeviceStatusResponse409> Duplicated code for this application
   * @throws FetchError<500, types.PostDeviceStatusResponse500> Server error
   */
  postDeviceStatus(body: types.PostDeviceStatusBodyParam, metadata: types.PostDeviceStatusMetadataParam): Promise<FetchResponse<200, types.PostDeviceStatusResponse200>>;
  postDeviceStatus(metadata: types.PostDeviceStatusMetadataParam): Promise<FetchResponse<200, types.PostDeviceStatusResponse200>>;
  postDeviceStatus(body?: types.PostDeviceStatusBodyParam | types.PostDeviceStatusMetadataParam, metadata?: types.PostDeviceStatusMetadataParam): Promise<FetchResponse<200, types.PostDeviceStatusResponse200>> {
    return this.core.fetch('/application/{id}/device/export', 'post', body, metadata);
  }

  /**
   * Returns a list of devices by externalIds
   *
   * @summary Returns a list of devices by externalIds
   */
  getDevicesByExternalCode(metadata: types.GetDevicesByExternalCodeMetadataParam): Promise<FetchResponse<200, types.GetDevicesByExternalCodeResponse200>> {
    return this.core.fetch('/application/{id}/device', 'get', metadata);
  }

  /**
   * Edit a set of devices. The indicated list of devices will be modified to apply the new
   * values.
   *
   *
   * @summary Edit a set of devices in bulk for the given externalIds or deviceIds
   * @throws FetchError<400, types.EditDevicesBulkResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.EditDevicesBulkResponse401> Invalid credentials
   * @throws FetchError<403, types.EditDevicesBulkResponse403> Operation forbidden for your user
   * @throws FetchError<500, types.EditDevicesBulkResponse500> Server error
   */
  editDevicesBulk(body: types.EditDevicesBulkBodyParam, metadata: types.EditDevicesBulkMetadataParam): Promise<FetchResponse<200, types.EditDevicesBulkResponse200>> {
    return this.core.fetch('/application/{id}/device', 'put', body, metadata);
  }

  /**
   * Edit a set of devices. The indicated list of devices will be modified to apply the new
   * values.
   * The file must include a header (`deviceId` or `externalId`).
   *
   *
   * @summary Edit a set of devices in bulk for the given externalIds or deviceIds
   * @throws FetchError<400, types.EditDevicesBulkCsvResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.EditDevicesBulkCsvResponse401> Invalid credentials
   * @throws FetchError<403, types.EditDevicesBulkCsvResponse403> Operation forbidden for your user
   * @throws FetchError<500, types.EditDevicesBulkCsvResponse500> Server error
   */
  editDevicesBulkCsv(body: types.EditDevicesBulkCsvBodyParam, metadata: types.EditDevicesBulkCsvMetadataParam): Promise<FetchResponse<200, types.EditDevicesBulkCsvResponse200>> {
    return this.core.fetch('/application/{id}/device/csv', 'put', body, metadata);
  }

  /**
   * Returns the short live token needed to be used on the
   * `/application/{id}/device/export/precalccsv/download` endpoint for downloading the CSV
   * file with the device status
   *
   *
   * @summary Obtains the necessary token to download the CSV file with the device status
   * @throws FetchError<400, types.GetDeviceStatusPrecalcCsvResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetDeviceStatusPrecalcCsvResponse401> Invalid credentials
   * @throws FetchError<403, types.GetDeviceStatusPrecalcCsvResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetDeviceStatusPrecalcCsvResponse404> Application not found
   * @throws FetchError<409, types.GetDeviceStatusPrecalcCsvResponse409> Duplicated code for this application
   * @throws FetchError<500, types.GetDeviceStatusPrecalcCsvResponse500> Server error
   */
  getDeviceStatusPrecalcCsv(metadata: types.GetDeviceStatusPrecalcCsvMetadataParam): Promise<FetchResponse<200, types.GetDeviceStatusPrecalcCsvResponse200>> {
    return this.core.fetch('/application/{id}/device/export/precalccsv', 'get', metadata);
  }

  /**
   * Return the precalculated CSV file containing latest device status
   * It is necessary to indicate in the query string `key` the security token obtained in the
   * endpoint `/application/{id}/device/export/precalccsv`.
   * As the authentication token is in the URL itself, this link can be opened in a new
   * browser tab to start the download.
   *
   *
   * @summary Return the precalculated device status CSV file
   * @throws FetchError<400, types.GetDeviceStatusPrecalcCsvDownloadResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetDeviceStatusPrecalcCsvDownloadResponse401> Invalid credentials
   * @throws FetchError<403, types.GetDeviceStatusPrecalcCsvDownloadResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetDeviceStatusPrecalcCsvDownloadResponse404> Application not found
   * @throws FetchError<409, types.GetDeviceStatusPrecalcCsvDownloadResponse409> Duplicated code for this application
   * @throws FetchError<500, types.GetDeviceStatusPrecalcCsvDownloadResponse500> Server error
   */
  getDeviceStatusPrecalcCsvDownload(metadata: types.GetDeviceStatusPrecalcCsvDownloadMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/application/{id}/device/export/precalccsv/download', 'get', metadata);
  }

  /**
   * Return the  information of device list. The maximum device will be 100000 if it is a
   * list given by the user. If a list is not indicated, the system returns all the devices
   * for that application, page the results. The user can choose the number of results and
   * the page to be show. Return the result in a csv file.
   *
   *
   * @summary Return the  information of device list
   * @throws FetchError<400, types.PostDeviceStatusCsvResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostDeviceStatusCsvResponse401> Invalid credentials
   * @throws FetchError<403, types.PostDeviceStatusCsvResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PostDeviceStatusCsvResponse404> Application not found
   * @throws FetchError<409, types.PostDeviceStatusCsvResponse409> Duplicated code for this application
   * @throws FetchError<500, types.PostDeviceStatusCsvResponse500> Server error
   */
  postDeviceStatusCsv(body: types.PostDeviceStatusCsvBodyParam, metadata: types.PostDeviceStatusCsvMetadataParam): Promise<FetchResponse<number, unknown>>;
  postDeviceStatusCsv(metadata: types.PostDeviceStatusCsvMetadataParam): Promise<FetchResponse<number, unknown>>;
  postDeviceStatusCsv(body?: types.PostDeviceStatusCsvBodyParam | types.PostDeviceStatusCsvMetadataParam, metadata?: types.PostDeviceStatusCsvMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/application/{id}/device/export/csv', 'post', body, metadata);
  }

  /**
   * Gets a paged list with the integrations (salesforce). Additionaly, return a field with
   * the user total for that account. 
   * Necessary query's parameters: * Id of the account (**accountId**), * Limit of user per
   * view (**limit**)   * Page to show (**page**) at least 0.  Optional filters: * Status
   * active (**enabled**) * Search by _name_, _email_, _serverId_ or _description_
   * (**find**). * Search by _Integration Type_ (ej. salesforce)
   *
   * @summary List of Ingrations
   * @throws FetchError<400, types.GetIntegratedUsersResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetIntegratedUsersResponse401> Invalid credentials
   * @throws FetchError<403, types.GetIntegratedUsersResponse403> Operation forbidden for your user
   * @throws FetchError<500, types.GetIntegratedUsersResponse500> Server error
   */
  getIntegratedUsers(metadata: types.GetIntegratedUsersMetadataParam): Promise<FetchResponse<200, types.GetIntegratedUsersResponse200>> {
    return this.core.fetch('/integration', 'get', metadata);
  }

  /**
   * Create a new  SalesForce integration. You must pass the client id (clientId) and the
   * user's password (clientSecret)
   *
   * @summary Create a New saleForce User
   * @throws FetchError<400, types.PostSalesForceUserResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostSalesForceUserResponse401> Invalid credentials
   * @throws FetchError<403, types.PostSalesForceUserResponse403> Operation forbidden for your user
   * @throws FetchError<500, types.PostSalesForceUserResponse500> Server error
   */
  postSalesForceUser(body: types.PostSalesForceUserBodyParam): Promise<FetchResponse<201, types.PostSalesForceUserResponse201>> {
    return this.core.fetch('/integration/salesforce', 'post', body);
  }

  /**
   * Update a salesforce user. You must indicate the id of the salesforce integration (id) in
   * the path. Modifiable data is the client id (clientId) or / and the user's password
   * (clientSecret) in salesforce
   *
   * @summary Update a salesforce integration
   * @throws FetchError<400, types.PutSalesForceUserResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PutSalesForceUserResponse401> Invalid credentials
   * @throws FetchError<403, types.PutSalesForceUserResponse403> Operation forbidden for your user
   * @throws FetchError<500, types.PutSalesForceUserResponse500> Server error
   */
  putSalesForceUser(body: types.PutSalesForceUserBodyParam, metadata: types.PutSalesForceUserMetadataParam): Promise<FetchResponse<200, types.PutSalesForceUserResponse200>> {
    return this.core.fetch('/integration/salesforce/{id}', 'put', body, metadata);
  }

  /**
   * Gets a salesforce integration by id. Only for integration with salesforce.
   *
   * @summary Show  salesforce integration for the given id
   * @throws FetchError<401, types.GetSalesForceUserResponse401> Invalid credentials
   * @throws FetchError<404, types.GetSalesForceUserResponse404> User not found
   * @throws FetchError<500, types.GetSalesForceUserResponse500> Server error
   */
  getSalesForceUser(metadata: types.GetSalesForceUserMetadataParam): Promise<FetchResponse<200, types.GetSalesForceUserResponse200>> {
    return this.core.fetch('/integration/salesforce/{id}', 'get', metadata);
  }

  /**
   * Create a new  SalesForce integration
   * Only one active Salesforce Service Cloud type integration can exist per account
   *
   *
   * @summary Create a new Salesforce Service Cloud integration
   * @throws FetchError<400, types.PostSfscUserResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostSfscUserResponse401> Invalid credentials
   * @throws FetchError<403, types.PostSfscUserResponse403> Operation forbidden for your user
   * @throws FetchError<409, types.PostSfscUserResponse409> There is already an active Salesforce Service Cloud type integration in this account
   * @throws FetchError<500, types.PostSfscUserResponse500> Server error
   */
  postSFSCUser(body: types.PostSfscUserBodyParam): Promise<FetchResponse<201, types.PostSfscUserResponse201>> {
    return this.core.fetch('/integration/sfsc', 'post', body);
  }

  /**
   * Download Salesforce Service Cloud certificate.
   *
   * @summary Download Salesforce Service Cloud certificate
   * @throws FetchError<401, types.GetSfscCertificateResponse401> Invalid credentials
   * @throws FetchError<404, types.GetSfscCertificateResponse404> User not found
   * @throws FetchError<500, types.GetSfscCertificateResponse500> Server error
   */
  getSFSCCertificate(metadata: types.GetSfscCertificateMetadataParam): Promise<FetchResponse<200, types.GetSfscCertificateResponse200>> {
    return this.core.fetch('/integration/sfsc/{id}/cert', 'get', metadata);
  }

  /**
   * Update a Salesforce Service Cloud integration. You must indicate the id of the
   * Salesforce integration (id) in the path.
   *
   * @summary Update a Salesforce Service Cloud integration
   * @throws FetchError<400, types.PutSfscUserResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PutSfscUserResponse401> Invalid credentials
   * @throws FetchError<403, types.PutSfscUserResponse403> Operation forbidden for your user
   * @throws FetchError<500, types.PutSfscUserResponse500> Server error
   */
  putSFSCUser(body: types.PutSfscUserBodyParam, metadata: types.PutSfscUserMetadataParam): Promise<FetchResponse<200, types.PutSfscUserResponse200>> {
    return this.core.fetch('/integration/sfsc/{id}', 'put', body, metadata);
  }

  /**
   * Gets a Salesforce Service CLoud integration by id.
   *
   * @summary Show Salesforce Service Cloud integration for the given id
   * @throws FetchError<401, types.GetSfscUserResponse401> Invalid credentials
   * @throws FetchError<404, types.GetSfscUserResponse404> User not found
   * @throws FetchError<500, types.GetSfscUserResponse500> Server error
   */
  getSFSCUser(metadata: types.GetSfscUserMetadataParam): Promise<FetchResponse<200, types.GetSfscUserResponse200>> {
    return this.core.fetch('/integration/sfsc/{id}', 'get', metadata);
  }

  /**
   * Create a new  Hubspot integration. You must pass the hubspot user id (user_id), hubspot
   * email address (user), hubspot id (hub_id), hubspot app id (app_id), refresh token and
   * indigitall application id (applicationId)
   *
   * @summary Create a new Hubspot User
   * @throws FetchError<400, types.PostHubspotUserResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostHubspotUserResponse401> Invalid credentials
   * @throws FetchError<403, types.PostHubspotUserResponse403> Operation forbidden for your user
   * @throws FetchError<409, types.PostHubspotUserResponse409> The integration already exists
   * @throws FetchError<500, types.PostHubspotUserResponse500> Server error
   */
  postHubspotUser(body: types.PostHubspotUserBodyParam): Promise<FetchResponse<201, types.PostHubspotUserResponse201>> {
    return this.core.fetch('/integration/hubspot', 'post', body);
  }

  /**
   * Update a hubspot user. You must indicate the user_id of the hubspot integration in the
   * path. Modifiable data is the refresh token (hubspotRefreshToken)
   *
   * @summary Update a hubspot integration
   * @throws FetchError<400, types.PutHubspotUserResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PutHubspotUserResponse401> Invalid credentials
   * @throws FetchError<403, types.PutHubspotUserResponse403> Operation forbidden for your user
   * @throws FetchError<500, types.PutHubspotUserResponse500> Server error
   */
  putHubspotUser(body: types.PutHubspotUserBodyParam, metadata: types.PutHubspotUserMetadataParam): Promise<FetchResponse<200, types.PutHubspotUserResponse200>> {
    return this.core.fetch('/integration/hubspot/{id}', 'put', body, metadata);
  }

  /**
   * Gets a hubspot integration by hubspot user_id. Only for integration with hubspot.
   *
   * @summary Show hubspot integration for the given hubspot user_id
   * @throws FetchError<401, types.GetHubspotUserResponse401> Invalid credentials
   * @throws FetchError<404, types.GetHubspotUserResponse404> User not found
   * @throws FetchError<500, types.GetHubspotUserResponse500> Server error
   */
  getHubspotUser(metadata: types.GetHubspotUserMetadataParam): Promise<FetchResponse<200, types.GetHubspotUserResponse200>> {
    return this.core.fetch('/integration/hubspot/{id}', 'get', metadata);
  }

  /**
   * Create a new  Cloud District integration. You must pass the Cloud District token.
   *
   * @summary Create a new Cloud District User
   * @throws FetchError<400, types.PostCloudDistrictUserResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostCloudDistrictUserResponse401> Invalid credentials
   * @throws FetchError<403, types.PostCloudDistrictUserResponse403> Operation forbidden for your user
   * @throws FetchError<409, types.PostCloudDistrictUserResponse409> The integration already exists
   * @throws FetchError<500, types.PostCloudDistrictUserResponse500> Server error
   */
  postCloudDistrictUser(body: types.PostCloudDistrictUserBodyParam): Promise<FetchResponse<201, types.PostCloudDistrictUserResponse201>> {
    return this.core.fetch('/integration/clouddistrict', 'post', body);
  }

  /**
   * Update a Cloud District user. You must indicate the user_id of the Cloud District
   * integration in the path. Modifiable data is the refresh token.
   *
   * @summary Update a Cloud District integration
   * @throws FetchError<400, types.PutCloudDistrictUserResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PutCloudDistrictUserResponse401> Invalid credentials
   * @throws FetchError<403, types.PutCloudDistrictUserResponse403> Operation forbidden for your user
   * @throws FetchError<500, types.PutCloudDistrictUserResponse500> Server error
   */
  putCloudDistrictUser(body: types.PutCloudDistrictUserBodyParam, metadata: types.PutCloudDistrictUserMetadataParam): Promise<FetchResponse<200, types.PutCloudDistrictUserResponse200>> {
    return this.core.fetch('/integration/clouddistrict/{id}', 'put', body, metadata);
  }

  /**
   * Gets a Cloud District integration by Cloud District user_id. Only for integration with
   * Cloud District.
   *
   * @summary Show Cloud District integration for the given Cloud District user_id
   * @throws FetchError<401, types.GetCloudDistrictUserResponse401> Invalid credentials
   * @throws FetchError<404, types.GetCloudDistrictUserResponse404> User not found
   * @throws FetchError<500, types.GetCloudDistrictUserResponse500> Server error
   */
  getCloudDistrictUser(metadata: types.GetCloudDistrictUserMetadataParam): Promise<FetchResponse<200, types.GetCloudDistrictUserResponse200>> {
    return this.core.fetch('/integration/clouddistrict/{id}', 'get', metadata);
  }

  /**
   * Create a new  WordPress integration. Only can access to GET /application and POST
   * /campaign/{id}/send/all endpoints
   *
   * @summary Create a new WordPress User
   * @throws FetchError<400, types.PostWordPressUserResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostWordPressUserResponse401> Invalid credentials
   * @throws FetchError<403, types.PostWordPressUserResponse403> Operation forbidden for your user
   * @throws FetchError<500, types.PostWordPressUserResponse500> Server error
   */
  postWordPressUser(body: types.PostWordPressUserBodyParam): Promise<FetchResponse<201, types.PostWordPressUserResponse201>> {
    return this.core.fetch('/integration/wordpress', 'post', body);
  }

  /**
   * Gets all wordpress integrations.
   *
   * @summary Show wordpress integrations
   * @throws FetchError<401, types.GetWordPressUsersResponse401> Invalid credentials
   * @throws FetchError<403, types.GetWordPressUsersResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetWordPressUsersResponse404> User not found
   * @throws FetchError<500, types.GetWordPressUsersResponse500> Server error
   */
  getWordPressUsers(): Promise<FetchResponse<200, types.GetWordPressUsersResponse200>> {
    return this.core.fetch('/integration/wordpress', 'get');
  }

  /**
   * Create a new zapier integration.
   *
   * @summary Create new zapier integration
   * @throws FetchError<400, types.PostZapierUserResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostZapierUserResponse401> Invalid credentials
   * @throws FetchError<403, types.PostZapierUserResponse403> Operation forbidden for your user
   * @throws FetchError<409, types.PostZapierUserResponse409> The integration already exists
   * @throws FetchError<500, types.PostZapierUserResponse500> Server error
   */
  postZapierUser(body: types.PostZapierUserBodyParam): Promise<FetchResponse<201, types.PostZapierUserResponse201>> {
    return this.core.fetch('/integration/zapier', 'post', body);
  }

  /**
   * Gets a zapier integration by id. Only for integration with Zapier.
   *
   * @summary Show integration user for the given zapier integration id
   * @throws FetchError<401, types.GetZapierUserResponse401> Invalid credentials
   * @throws FetchError<404, types.GetZapierUserResponse404> User not found
   * @throws FetchError<500, types.GetZapierUserResponse500> Server error
   */
  getZapierUser(metadata: types.GetZapierUserMetadataParam): Promise<FetchResponse<200, types.GetZapierUserResponse200>> {
    return this.core.fetch('/integration/zapier/{id}', 'get', metadata);
  }

  /**
   * Register a phone number in the WhatsApp integration platform to be able to send and
   * receive messages. 
   * You must indicate the id of the application (id) in the path.
   * Registration process is documented in
   * https://developers.facebook.com/docs/whatsapp/api/account
   *
   *
   * @summary Register WhatsApp telephone number
   * @throws FetchError<400, types.RegisterWhatsappIntegrationResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.RegisterWhatsappIntegrationResponse401> Invalid credentials
   * @throws FetchError<403, types.RegisterWhatsappIntegrationResponse403> Operation forbidden for your user
   * @throws FetchError<500, types.RegisterWhatsappIntegrationResponse500> Server error
   */
  registerWhatsappIntegration(body: types.RegisterWhatsappIntegrationBodyParam, metadata: types.RegisterWhatsappIntegrationMetadataParam): Promise<FetchResponse<200, types.RegisterWhatsappIntegrationResponse200>> {
    return this.core.fetch('/chat/whatsapp/register', 'post', body, metadata);
  }

  /**
   * During the registration of the telephone number an SMS message or a call is received.
   * The code provided must be included in this call to proceed with the validation.
   * You must indicate the id of the application (id) in the path.
   * Registration process is documented in
   * https://developers.facebook.com/docs/whatsapp/api/account
   *
   *
   * @summary Verify WhatsApp telephone number
   * @throws FetchError<400, types.VerifyWhatsappIntegrationResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.VerifyWhatsappIntegrationResponse401> Invalid credentials
   * @throws FetchError<403, types.VerifyWhatsappIntegrationResponse403> Operation forbidden for your user
   * @throws FetchError<500, types.VerifyWhatsappIntegrationResponse500> Server error
   */
  verifyWhatsappIntegration(body: types.VerifyWhatsappIntegrationBodyParam, metadata: types.VerifyWhatsappIntegrationMetadataParam): Promise<FetchResponse<200, types.VerifyWhatsappIntegrationResponse200>> {
    return this.core.fetch('/chat/whatsapp/verify', 'post', body, metadata);
  }

  /**
   * Allows you to register a phone number shared with Indigitall (BSP) in an instance
   *
   *
   * @summary Register an existing WABA in the channel config
   * @throws FetchError<400, types.RegisterWabaResponse400> Parameters missing or not in right format
   * @throws FetchError<403, types.RegisterWabaResponse403> Operation forbidden for your user
   * @throws FetchError<500, types.RegisterWabaResponse500> Server error
   */
  registerWaba(body: types.RegisterWabaBodyParam, metadata: types.RegisterWabaMetadataParam): Promise<FetchResponse<200, types.RegisterWabaResponse200>> {
    return this.core.fetch('/chat/waba/register', 'post', body, metadata);
  }

  /**
   * Returns the list of WABAs shared with Indigitall
   *
   * This endpoint has two operation modes:
   *   - When setting `debug_token` (obtained at the end of the onboarding process) the WABAs
   * and phone number shared by the client are synchronized
   *   - When not setting `debug_token`, the last WABAs and phone number are obtained from
   * our DB (no data is synchronized)
   *
   * This endpoint allows get the information that will be shown to the client so that they
   * can select which
   * phone numbers they want to register in the instance
   *
   *
   * @summary Returns the list of WABAs shared with Indigitall
   * @throws FetchError<400, types.GetWabaResponse400> Parameters missing or not in right format
   * @throws FetchError<403, types.GetWabaResponse403> Operation forbidden for your user
   * @throws FetchError<500, types.GetWabaResponse500> Server error
   */
  getWaba(metadata: types.GetWabaMetadataParam): Promise<FetchResponse<200, types.GetWabaResponse200>> {
    return this.core.fetch('/chat/waba', 'get', metadata);
  }

  /**
   * Create a template for a WABA
   *
   *
   * @summary Create a template for a WABA
   * @throws FetchError<400, types.PostWabaTemplateResponse400> Parameters missing or not in right format
   * @throws FetchError<403, types.PostWabaTemplateResponse403> Operation forbidden for your user
   * @throws FetchError<500, types.PostWabaTemplateResponse500> Server error
   */
  postWabaTemplate(body: types.PostWabaTemplateBodyParam, metadata: types.PostWabaTemplateMetadataParam): Promise<FetchResponse<200, types.PostWabaTemplateResponse200>> {
    return this.core.fetch('/chat/waba/{wabaId}/template', 'post', body, metadata);
  }

  /**
   * Returns a templates list for a WABA
   *
   *
   * @summary Returns a templates list for a WABA
   * @throws FetchError<400, types.GetWabaTemplatesResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetWabaTemplatesResponse401> Invalid credentials
   * @throws FetchError<403, types.GetWabaTemplatesResponse403> Operation forbidden for your user
   * @throws FetchError<500, types.GetWabaTemplatesResponse500> Server error
   */
  getWabaTemplates(metadata: types.GetWabaTemplatesMetadataParam): Promise<FetchResponse<200, types.GetWabaTemplatesResponse200>> {
    return this.core.fetch('/chat/waba/{wabaId}/templates', 'get', metadata);
  }

  /**
   * Set settings for a WABA E-commerce
   *
   *
   * @summary Get settings for a WABA E-commerce
   * @throws FetchError<400, types.GetWabaEcommerceSettingsResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.GetWabaEcommerceSettingsResponse500> Server error
   */
  getWabaEcommerceSettings(metadata: types.GetWabaEcommerceSettingsMetadataParam): Promise<FetchResponse<200, types.GetWabaEcommerceSettingsResponse200>> {
    return this.core.fetch('/chat/waba/{wabaId}/ecommerce/{phoneNumberId}/settings', 'get', metadata);
  }

  /**
   * Set settings for WABA E-commerce
   *
   *
   * @summary Set settings for WABA E-commerce
   * @throws FetchError<400, types.PutWabaEcommerceSettingsResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.PutWabaEcommerceSettingsResponse500> Server error
   */
  putWabaEcommerceSettings(body: types.PutWabaEcommerceSettingsBodyParam, metadata: types.PutWabaEcommerceSettingsMetadataParam): Promise<FetchResponse<200, types.PutWabaEcommerceSettingsResponse200>>;
  putWabaEcommerceSettings(metadata: types.PutWabaEcommerceSettingsMetadataParam): Promise<FetchResponse<200, types.PutWabaEcommerceSettingsResponse200>>;
  putWabaEcommerceSettings(body?: types.PutWabaEcommerceSettingsBodyParam | types.PutWabaEcommerceSettingsMetadataParam, metadata?: types.PutWabaEcommerceSettingsMetadataParam): Promise<FetchResponse<200, types.PutWabaEcommerceSettingsResponse200>> {
    return this.core.fetch('/chat/waba/{wabaId}/ecommerce/{phoneNumberId}/settings', 'put', body, metadata);
  }

  /**
   * Delete a template for a WABA
   *
   *
   * @summary Delete a template for a WABA
   * @throws FetchError<400, types.DeleteWabaTemplateResponse400> Parameters missing or not in right format
   * @throws FetchError<403, types.DeleteWabaTemplateResponse403> Operation forbidden for your user
   * @throws FetchError<500, types.DeleteWabaTemplateResponse500> Server error
   */
  deleteWabaTemplate(metadata: types.DeleteWabaTemplateMetadataParam): Promise<FetchResponse<200, types.DeleteWabaTemplateResponse200>> {
    return this.core.fetch('/chat/waba/{wabaId}/template/{templateName}', 'delete', metadata);
  }

  /**
   * This process generate an API Key from the 360dialog API and save the new config in the
   * instance_channel_config
   *
   * @summary Generate API Key and create the config in database for the this instance
   * @throws FetchError<400, types.Generate360TokenResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.Generate360TokenResponse401> Invalid credentials
   * @throws FetchError<403, types.Generate360TokenResponse403> Operation forbidden for your user
   * @throws FetchError<500, types.Generate360TokenResponse500> Server error
   */
  generate360token(body: types.Generate360TokenBodyParam, metadata: types.Generate360TokenMetadataParam): Promise<FetchResponse<200, types.Generate360TokenResponse200>> {
    return this.core.fetch('/chat/whatsapp/generate360token', 'post', body, metadata);
  }

  /**
   * This process must be excecuted in order to receive user messages through the 360Dialog
   * API.
   * This endpoint must be invoked after having configured both the instance and the WhatsApp
   * channel with all its parameters.
   *
   *
   * @summary Configure the URL of the webhook 360Dialog service
   * @throws FetchError<400, types.Configure360Response400> Parameters missing or not in right format
   * @throws FetchError<401, types.Configure360Response401> Invalid credentials
   * @throws FetchError<403, types.Configure360Response403> Operation forbidden for your user
   * @throws FetchError<500, types.Configure360Response500> Server error
   */
  configure360(metadata: types.Configure360MetadataParam): Promise<FetchResponse<200, types.Configure360Response200>> {
    return this.core.fetch('/chat/whatsapp/configure360', 'post', metadata);
  }

  /**
   * Delete the Integrated. Only for integration to which the requesting user belongs.
   *
   * @summary Delete a user with the given id
   * @throws FetchError<401, types.DeleteIntegratedUserResponse401> Invalid credentials
   * @throws FetchError<403, types.DeleteIntegratedUserResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.DeleteIntegratedUserResponse404> User not found
   * @throws FetchError<500, types.DeleteIntegratedUserResponse500> Server error
   */
  deleteIntegratedUser(metadata: types.DeleteIntegratedUserMetadataParam): Promise<FetchResponse<200, types.DeleteIntegratedUserResponse200>> {
    return this.core.fetch('/integration/{id}', 'delete', metadata);
  }

  /**
   * Create a new inApp campaign. The user must have permissions to create inApp campaigns in
   * that application
   *
   * @summary Create a New inApp
   * @throws FetchError<400, types.PostCreateInAppResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostCreateInAppResponse401> Invalid credentials
   * @throws FetchError<403, types.PostCreateInAppResponse403> Operation forbidden for your user
   * @throws FetchError<500, types.PostCreateInAppResponse500> Server error
   */
  postCreateInApp(body: types.PostCreateInAppBodyParam): Promise<FetchResponse<201, types.PostCreateInAppResponse201>> {
    return this.core.fetch('/inApp', 'post', body);
  }

  /**
   * Shows the list of inApp campaigns for an application.
   * The parameters __limit__ (number of items to display per page, max: 100), __page__
   * (number of the page shown, min: 0) and __aplicationId__ (application id) are required.
   * To filter you can use the parameters __find__ (to find the name of the inApp),
   * __enabled__ (state of the campaign), __platform__ `(platform type: ios, android,webpush
   * ...)`.  
   * To order you can use the parameter __orderBy__ (Name A-Z, Name Z-A, Date ascending, Date
   * descending)
   *
   * @summary get a list of inApp 
   * @throws FetchError<400, types.GetInAppResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetInAppResponse401> Invalid credentials
   * @throws FetchError<403, types.GetInAppResponse403> Operation forbidden for your user
   * @throws FetchError<500, types.GetInAppResponse500> Server error
   */
  getInApp(metadata: types.GetInAppMetadataParam): Promise<FetchResponse<200, types.GetInAppResponse200>> {
    return this.core.fetch('/inApp', 'get', metadata);
  }

  /**
   * Update a inApp campaign. The variables to be modified are passed through the body.
   *
   * @summary Update a New inApp
   * @throws FetchError<400, types.PutInAppResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PutInAppResponse401> Invalid credentials
   * @throws FetchError<403, types.PutInAppResponse403> Operation forbidden for your user
   * @throws FetchError<500, types.PutInAppResponse500> Server error
   */
  putInApp(body: types.PutInAppBodyParam, metadata: types.PutInAppMetadataParam): Promise<FetchResponse<200, types.PutInAppResponse200>> {
    return this.core.fetch('/inApp/{id}', 'put', body, metadata);
  }

  /**
   * Get data from an inApp campaign. The id of the campaign must be passed through the path
   *
   * @summary get a inApp
   * @throws FetchError<400, types.GetSingleInAppResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetSingleInAppResponse401> Invalid credentials
   * @throws FetchError<403, types.GetSingleInAppResponse403> Operation forbidden for your user
   * @throws FetchError<500, types.GetSingleInAppResponse500> Server error
   */
  getSingleInApp(metadata: types.GetSingleInAppMetadataParam): Promise<FetchResponse<200, types.GetSingleInAppResponse200>> {
    return this.core.fetch('/inApp/{id}', 'get', metadata);
  }

  /**
   * Deletes the selected inApp.
   *
   * @summary Delete a inApp with the given inApp's id
   * @throws FetchError<400, types.DeleteInAppResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.DeleteInAppResponse401> Invalid credentials
   * @throws FetchError<403, types.DeleteInAppResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.DeleteInAppResponse404> Campaign not found
   * @throws FetchError<500, types.DeleteInAppResponse500> Server error
   */
  deleteInApp(metadata: types.DeleteInAppMetadataParam): Promise<FetchResponse<200, types.DeleteInAppResponse200>> {
    return this.core.fetch('/inApp/{id}', 'delete', metadata);
  }

  /**
   * Sets a list of target devices for the inApp campaign from a .csv file. The format of the
   * .csv file must be one device code per line.
   *
   * @summary Set a list of target devices for inApp campaign
   * @throws FetchError<400, types.PostInAppTargetsResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostInAppTargetsResponse401> Invalid credentials
   * @throws FetchError<403, types.PostInAppTargetsResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PostInAppTargetsResponse404> Campaign not found
   * @throws FetchError<500, types.PostInAppTargetsResponse500> Server error
   */
  postInAppTargets(body: types.PostInAppTargetsBodyParam, metadata: types.PostInAppTargetsMetadataParam): Promise<FetchResponse<200, types.PostInAppTargetsResponse200>> {
    return this.core.fetch('/inApp/{id}/targets', 'post', body, metadata);
  }

  /**
   * Get a list of in-app stats by application in a date range.
   *
   * The parameters `applicationId` (application id), `dateFrom` (start
   * date), `dateTo` (end date), `limit` (limit of elements per page) and
   * `page` (page shown) are required.
   *
   * @summary Get a list of in-app stats by application
   * @throws FetchError<400, types.InAppStatsResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.InAppStatsResponse401> Invalid credentials
   * @throws FetchError<403, types.InAppStatsResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.InAppStatsResponse404> Application not found
   * @throws FetchError<500, types.InAppStatsResponse500> Server error
   */
  inAppStats(metadata: types.InAppStatsMetadataParam): Promise<FetchResponse<200, types.InAppStatsResponse200>> {
    return this.core.fetch('/inApp/stats', 'get', metadata);
  }

  /**
   * List of inApp statistics for the selected application, filtered between the dates given.
   *
   * @summary Show the inApp statistics for the given application's id between two dates
   * @throws FetchError<400, types.InAppDateStatsResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.InAppDateStatsResponse401> Invalid credentials
   * @throws FetchError<403, types.InAppDateStatsResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.InAppDateStatsResponse404> Application not found
   * @throws FetchError<500, types.InAppDateStatsResponse500> Server error
   */
  inAppDateStats(metadata: types.InAppDateStatsMetadataParam): Promise<FetchResponse<200, types.InAppDateStatsResponse200>> {
    return this.core.fetch('/inApp/dateStats', 'get', metadata);
  }

  /**
   * List of inApp statistics for the selected application, filtered between the dates given.
   * CSV format.
   *
   * @summary Show the inApp statistics for the given application's id between two dates in CSV format
   * @throws FetchError<400, types.InAppDateStatsCsvResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.InAppDateStatsCsvResponse401> Invalid credentials
   * @throws FetchError<403, types.InAppDateStatsCsvResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.InAppDateStatsCsvResponse404> Application not found
   * @throws FetchError<500, types.InAppDateStatsCsvResponse500> Server error
   */
  inAppDateStatsCSV(metadata: types.InAppDateStatsCsvMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/inApp/dateStats/csv', 'get', metadata);
  }

  /**
   * Download the inApp statistics from Statistics/ Campaign Inapp/Inweb by doing click in
   * the "Download" CSV button. By default has 5000 line limit per file.
   *
   * @summary Download the inApp statistics for the given application's id between two dates selected
   * in the console datepicker
   * @throws FetchError<400, types.GetInappStatsDownloadcsvResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetInappStatsDownloadcsvResponse401> Invalid credentials
   * @throws FetchError<403, types.GetInappStatsDownloadcsvResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetInappStatsDownloadcsvResponse404> Application not found
   * @throws FetchError<500, types.GetInappStatsDownloadcsvResponse500> Server error
   */
  getInappStatsDownloadcsv(metadata: types.GetInappStatsDownloadcsvMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/inApp/stats/downloadCSV', 'get', metadata);
  }

  /**
   * Adds image to a inApp campaign, which will be used in the content of the InApp campaign.
   * These types are valid:
   * 'image/jpeg', 'image/gif', 'image/png'.
   *
   *
   * @summary Add a picture to the given inApp campaign's id
   * @throws FetchError<400, types.PostInAppImageResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostInAppImageResponse401> Invalid credentials
   * @throws FetchError<403, types.PostInAppImageResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PostInAppImageResponse404> inApp not found
   * @throws FetchError<500, types.PostInAppImageResponse500> Server error
   */
  postInAppImage(body: types.PostInAppImageBodyParam, metadata: types.PostInAppImageMetadataParam): Promise<FetchResponse<200, types.PostInAppImageResponse200>> {
    return this.core.fetch('/inApp/{id}/image', 'post', body, metadata);
  }

  /**
   * Adds image that it will use an inApp campaign. The types are valid:
   * 'image/jpeg', 'image/gif', 'image/png'.
   *
   *
   * @summary Add a picture to the given application's id
   * @throws FetchError<400, types.AddInAppImageResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.AddInAppImageResponse401> Invalid credentials
   * @throws FetchError<403, types.AddInAppImageResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.AddInAppImageResponse404> inApp not found
   * @throws FetchError<500, types.AddInAppImageResponse500> Server error
   */
  addInAppImage(body: types.AddInAppImageBodyParam, metadata: types.AddInAppImageMetadataParam): Promise<FetchResponse<200, types.AddInAppImageResponse200>> {
    return this.core.fetch('/inApp/image', 'post', body, metadata);
  }

  /**
   * Calculate the number of impacted devices in a inApp. 
   * This is a simulation of impacts of a possible inApp with specific filters. Filters and
   * other parameters are passed through the inApp object
   *
   * @summary Show number of reached devices for inApp
   * @throws FetchError<400, types.PostInAppImpactsResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PostInAppImpactsResponse401> Invalid credentials
   * @throws FetchError<403, types.PostInAppImpactsResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PostInAppImpactsResponse404> Application not found
   * @throws FetchError<500, types.PostInAppImpactsResponse500> Server error
   */
  postInAppImpacts(body: types.PostInAppImpactsBodyParam): Promise<FetchResponse<200, types.PostInAppImpactsResponse200>> {
    return this.core.fetch('/inApp/impacts', 'post', body);
  }

  /**
   * Returns statistics for an in-app by platform.
   *
   * Optionally, you can filter the inApp's version `inAppVersionId` and the date range
   * (`dateFrom` & `dateTo`)
   *
   * @summary Shows the stats of the active inApp Campaign between two dates given
   * @throws FetchError<400, types.InAppStatsByIdResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.InAppStatsByIdResponse401> Invalid credentials
   * @throws FetchError<403, types.InAppStatsByIdResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.InAppStatsByIdResponse404> Application not found
   * @throws FetchError<500, types.InAppStatsByIdResponse500> Server error
   */
  inAppStatsById(metadata: types.InAppStatsByIdMetadataParam): Promise<FetchResponse<200, types.InAppStatsByIdResponse200>> {
    return this.core.fetch('/inApp/{id}/stats', 'get', metadata);
  }

  /**
   * Creates multimedia item
   *
   *
   * @summary Creates multimedia item
   * @throws FetchError<400, types.PostMultimediaResponse400> Parameters missing or not in right format
   * @throws FetchError<403, types.PostMultimediaResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PostMultimediaResponse404> Application not found
   * @throws FetchError<500, types.PostMultimediaResponse500> Server error
   */
  postMultimedia(body: types.PostMultimediaBodyParam): Promise<FetchResponse<200, types.PostMultimediaResponse200>> {
    return this.core.fetch('/chat/multimedia', 'post', body);
  }

  /**
   * Returns a list with all the multimedia content available for a specific application.
   *
   * Id of the application (**applicationId**) is required
   *
   *
   * @summary Get a list of all multimedia content
   * @throws FetchError<400, types.GetMultimediaListResponse400> Parameters missing or not in right format
   * @throws FetchError<403, types.GetMultimediaListResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetMultimediaListResponse404> Application not found
   * @throws FetchError<500, types.GetMultimediaListResponse500> Server error
   */
  getMultimediaList(metadata: types.GetMultimediaListMetadataParam): Promise<FetchResponse<200, types.GetMultimediaListResponse200>> {
    return this.core.fetch('/chat/multimedia', 'get', metadata);
  }

  /**
   * Returns a multimedia item
   *
   *
   * @summary Returns a multimedia item
   * @throws FetchError<400, types.GetMultimediaResponse400> Parameters missing or not in right format
   * @throws FetchError<403, types.GetMultimediaResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetMultimediaResponse404> Application not found
   * @throws FetchError<500, types.GetMultimediaResponse500> Server error
   */
  getMultimedia(metadata: types.GetMultimediaMetadataParam): Promise<FetchResponse<200, types.GetMultimediaResponse200>> {
    return this.core.fetch('/chat/multimedia/{id}', 'get', metadata);
  }

  /**
   * Edit an existing multimedia item
   *
   *
   * @summary Edit an existing multimedia item
   * @throws FetchError<400, types.PutMultimediaResponse400> Parameters missing or not in right format
   * @throws FetchError<403, types.PutMultimediaResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.PutMultimediaResponse404> Application not found
   * @throws FetchError<500, types.PutMultimediaResponse500> Server error
   */
  putMultimedia(body: types.PutMultimediaBodyParam, metadata: types.PutMultimediaMetadataParam): Promise<FetchResponse<200, types.PutMultimediaResponse200>> {
    return this.core.fetch('/chat/multimedia/{id}', 'put', body, metadata);
  }

  /**
   * Delete a multimedia content.
   *
   * **Warning:** This method performs a physical erase, so **it is not possible to rescue
   * the deleted content** again.
   *
   * **Warning:** If this multimedia content is deleted but there are **still references to
   * it** (for example, in a Dialogflow attempt) errors may occur during the sending of these
   * messages.
   *
   *
   * @summary Delete multimedia content
   * @throws FetchError<400, types.DeleteMultimediaResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.DeleteMultimediaResponse401> Invalid credentials
   * @throws FetchError<403, types.DeleteMultimediaResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.DeleteMultimediaResponse404> Application not found
   * @throws FetchError<500, types.DeleteMultimediaResponse500> Server error
   */
  deleteMultimedia(metadata: types.DeleteMultimediaMetadataParam): Promise<FetchResponse<200, types.DeleteMultimediaResponse200>> {
    return this.core.fetch('/chat/multimedia/{id}', 'delete', metadata);
  }

  /**
   * This method returns the contents of the file stored in our storage.
   *
   *
   * @summary Returns the content of the multimedia item
   * @throws FetchError<400, types.DownloadMultimediaResponse400> Parameters missing or not in right format
   * @throws FetchError<403, types.DownloadMultimediaResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.DownloadMultimediaResponse404> Application not found
   * @throws FetchError<500, types.DownloadMultimediaResponse500> Server error
   */
  downloadMultimedia(metadata: types.DownloadMultimediaMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/chat/multimedia/{id}/download', 'get', metadata);
  }

  /**
   * Returns the token to be used for authentication in the websocket with chat-service.
   * The token provided owns to the user who is authenticated in admin-api.
   *
   *
   * @summary Returns chat websocket service token
   * @throws FetchError<400, types.GetChatTokenResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetChatTokenResponse401> Invalid credentials
   * @throws FetchError<403, types.GetChatTokenResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetChatTokenResponse404> Application not found
   * @throws FetchError<500, types.GetChatTokenResponse500> Server error
   */
  getChatToken(metadata: types.GetChatTokenMetadataParam): Promise<FetchResponse<200, types.GetChatTokenResponse200>> {
    return this.core.fetch('/chat/agent/auth', 'get', metadata);
  }

  /**
   * Returns status of application agents.
   *
   * @summary Get agents status by application
   * @throws FetchError<400, types.GetAgentsStatusResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.GetAgentsStatusResponse500> Server error
   */
  getAgentsStatus(metadata?: types.GetAgentsStatusMetadataParam): Promise<FetchResponse<200, types.GetAgentsStatusResponse200>> {
    return this.core.fetch('/chat/agent/status', 'get', metadata);
  }

  /**
   * Returns an agent group list from an application
   *
   * @summary Returns an agent group list from an application
   * @throws FetchError<400, types.GetAllAgentGroupsResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.GetAllAgentGroupsResponse500> Server error
   */
  getAllAgentGroups(metadata: types.GetAllAgentGroupsMetadataParam): Promise<FetchResponse<200, types.GetAllAgentGroupsResponse200>> {
    return this.core.fetch('/chat/agent/group', 'get', metadata);
  }

  /**
   * Create a new agent group associated with an application
   *
   * @summary Create a new agent group associated with an application
   * @throws FetchError<400, types.CreateAgentGroupResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.CreateAgentGroupResponse500> Server error
   */
  createAgentGroup(body: types.CreateAgentGroupBodyParam, metadata: types.CreateAgentGroupMetadataParam): Promise<FetchResponse<200, types.CreateAgentGroupResponse200>> {
    return this.core.fetch('/chat/agent/group', 'post', body, metadata);
  }

  /**
   * Edit an agent group to an application
   *
   * @summary Edit an agent group to an application
   * @throws FetchError<400, types.UpdateAgentGroupResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.UpdateAgentGroupResponse500> Server error
   */
  updateAgentGroup(body: types.UpdateAgentGroupBodyParam, metadata: types.UpdateAgentGroupMetadataParam): Promise<FetchResponse<200, types.UpdateAgentGroupResponse200>> {
    return this.core.fetch('/chat/agent/group/{id}', 'put', body, metadata);
  }

  /**
   * Delete an agent group with an application
   *
   * @summary Delete an agent group with an application
   * @throws FetchError<400, types.DeleteAgentGroupResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.DeleteAgentGroupResponse500> Server error
   */
  deleteAgentGroup(metadata: types.DeleteAgentGroupMetadataParam): Promise<FetchResponse<200, types.DeleteAgentGroupResponse200>> {
    return this.core.fetch('/chat/agent/group/{id}', 'delete', metadata);
  }

  /**
   * Returns agent group list from an application
   *
   * @summary Returns agent group list from an application
   * @throws FetchError<400, types.GetAllGroupsForOneAgentResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.GetAllGroupsForOneAgentResponse500> Server error
   */
  getAllGroupsForOneAgent(metadata: types.GetAllGroupsForOneAgentMetadataParam): Promise<FetchResponse<200, types.GetAllGroupsForOneAgentResponse200>> {
    return this.core.fetch('/chat/user/{id}/group', 'get', metadata);
  }

  /**
   * Adds and user to a group
   *
   * @summary Adds and user to a group
   * @throws FetchError<400, types.AddUserToGroupResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.AddUserToGroupResponse500> Server error
   */
  addUserToGroup(body: types.AddUserToGroupBodyParam, metadata: types.AddUserToGroupMetadataParam): Promise<FetchResponse<200, types.AddUserToGroupResponse200>> {
    return this.core.fetch('/chat/user/{id}/group', 'post', body, metadata);
  }

  /**
   * Removes and unser from a group chat
   *
   * @summary Removes and unser from a group chat
   * @throws FetchError<400, types.RemoveUserFromGroupResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.RemoveUserFromGroupResponse500> Server error
   */
  removeUserFromGroup(body: types.RemoveUserFromGroupBodyParam, metadata: types.RemoveUserFromGroupMetadataParam): Promise<FetchResponse<200, types.RemoveUserFromGroupResponse200>> {
    return this.core.fetch('/chat/user/{id}/group', 'delete', body, metadata);
  }

  /**
   * Send a message to the user using the previously configured communication
   * channels.
   *
   * **Slicing only available when sending messages with `sendType='proactive'`.**
   *
   *
   * @summary Send message to a user
   * @throws FetchError<400, types.SendMessageResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.SendMessageResponse401> Invalid credentials
   * @throws FetchError<500, types.SendMessageResponse500> Server error
   */
  sendMessage(body: types.SendMessageBodyParam, metadata: types.SendMessageMetadataParam): Promise<FetchResponse<200, types.SendMessageResponse200>> {
    return this.core.fetch('/chat/send', 'post', body, metadata);
  }

  /**
   * This endpoint allows you to send a list of messages through a CSV file.
   *
   * Messages will always be sent using **slicing** if it is active and if the conditions are
   * met.
   *
   *
   * @summary Send message to a list of usersd with CSV.
   * @throws FetchError<400, types.SendMessageCsvResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.SendMessageCsvResponse401> Invalid credentials
   * @throws FetchError<500, types.SendMessageCsvResponse500> Server error
   */
  sendMessageCsv(body: types.SendMessageCsvBodyParam): Promise<FetchResponse<200, types.SendMessageCsvResponse200>> {
    return this.core.fetch('/chat/send/csv', 'post', body);
  }

  /**
   * This endpoint allows you to send a list of messages through a CSV file.
   *
   * Receives the format to generate the message to send in JSON format. 
   * This format must be composed with the template data to be used, with special emphasis on
   * the namespace, 
   * the template name and the variables used in the template components.
   *
   * The CSV, for each destination, must have information about the variables defined in the
   * template. 
   * The header of the file must correspond to the JSON sent that corresponds to a given
   * template.
   *
   *
   * @summary Send message with vars by CSV.
   * @throws FetchError<400, types.SendMessageCsvAltResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.SendMessageCsvAltResponse401> Invalid credentials
   * @throws FetchError<500, types.SendMessageCsvAltResponse500> Server error
   */
  sendMessageCsvAlt(body: types.SendMessageCsvAltBodyParam): Promise<FetchResponse<200, types.SendMessageCsvAltResponse200>> {
    return this.core.fetch('/chat/send/csvalt', 'post', body);
  }

  /**
   * Send a message to the user using the previously configured communication
   * channels.
   *
   * Messages will always be sent using **slicing** if it is active and if the conditions are
   * met.
   *
   *
   * @summary Send a message to all users who have agreed to receive messages.
   * @throws FetchError<400, types.SendMessageAllResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.SendMessageAllResponse401> Invalid credentials
   * @throws FetchError<500, types.SendMessageAllResponse500> Server error
   */
  sendMessageAll(body: types.SendMessageAllBodyParam, metadata: types.SendMessageAllMetadataParam): Promise<FetchResponse<200, types.SendMessageAllResponse200>> {
    return this.core.fetch('/chat/send/all', 'post', body, metadata);
  }

  /**
   * Returns a CSV file with a history of messages stored in database.
   *
   *
   * @summary Get message history
   * @throws FetchError<400, types.GetMessageHistoryCsvResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetMessageHistoryCsvResponse401> Invalid credentials
   * @throws FetchError<500, types.GetMessageHistoryCsvResponse500> Server error
   */
  getMessageHistoryCsv(metadata: types.GetMessageHistoryCsvMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/chat/history/csv', 'get', metadata);
  }

  /**
   * Returns a list with all channels associated to an instance.
   *
   *
   * @summary Returns a list with all channels associated to an instance
   * @throws FetchError<400, types.GetChannelListResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.GetChannelListResponse500> Server error
   */
  getChannelList(metadata: types.GetChannelListMetadataParam): Promise<FetchResponse<200, types.GetChannelListResponse200>> {
    return this.core.fetch('/chat/channel', 'get', metadata);
  }

  /**
   * Create a new channel associated with an instance
   *
   *
   * @summary Create a new channel associated with an instance
   * @throws FetchError<400, types.PostChannelResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.PostChannelResponse500> Server error
   */
  postChannel(body: types.PostChannelBodyParam, metadata: types.PostChannelMetadataParam): Promise<FetchResponse<200, types.PostChannelResponse200>> {
    return this.core.fetch('/chat/channel', 'post', body, metadata);
  }

  /**
   * Edit a channels associated to an instance.
   * Only the parameters sent in the request will be replaced. The rest of the parameters
   * will not be modified.
   *
   *
   * @summary Edit a channels associated to an instance
   * @throws FetchError<400, types.PutChannelResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.PutChannelResponse500> Server error
   */
  putChannel(body: types.PutChannelBodyParam, metadata: types.PutChannelMetadataParam): Promise<FetchResponse<200, types.PutChannelResponse200>> {
    return this.core.fetch('/chat/channel/{id}', 'put', body, metadata);
  }

  /**
   * Delete a channel associated with an instance
   *
   *
   * @summary Delete a channel associated with an instance
   * @throws FetchError<400, types.DeleteChannelResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.DeleteChannelResponse500> Server error
   */
  deleteChannel(metadata: types.DeleteChannelMetadataParam): Promise<FetchResponse<200, types.DeleteChannelResponse200>> {
    return this.core.fetch('/chat/channel/{id}', 'delete', metadata);
  }

  /**
   * Get all the contacts in JSON format
   *
   * Pagination is mandatory, it must indicate `page` (**deprecated**) or `lastId`
   * (**recommended**)
   *
   *
   * @summary Get all contacts
   * @throws FetchError<401, types.GetContactsResponse401> Invalid credentials
   * @throws FetchError<500, types.GetContactsResponse500> Server error
   */
  getContacts(metadata: types.GetContactsMetadataParam): Promise<FetchResponse<200, types.GetContactsResponse200>> {
    return this.core.fetch('/chat/contacts', 'get', metadata);
  }

  /**
   * Bulk edit the information associated with a list of contacts
   *
   * The contact must already exist. If it does not exist, no operation will be performed.
   *
   * A maximum of 250 contacts can be indicated in a single request
   *
   *
   * @summary Contacts bulk update
   * @throws FetchError<400, types.EditContactAttributesResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.EditContactAttributesResponse401> Invalid credentials
   * @throws FetchError<500, types.EditContactAttributesResponse500> Server error
   */
  editContactAttributes(body: types.EditContactAttributesBodyParam, metadata: types.EditContactAttributesMetadataParam): Promise<FetchResponse<200, types.EditContactAttributesResponse200>> {
    return this.core.fetch('/chat/contacts', 'put', body, metadata);
  }

  /**
   * Get the differents contacts session in CSV format
   *
   *
   * @summary Get the differents contacts session
   * @throws FetchError<401, types.GetContactsCsvResponse401> Invalid credentials
   * @throws FetchError<403, types.GetContactsCsvResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetContactsCsvResponse404> Application not found
   * @throws FetchError<500, types.GetContactsCsvResponse500> Server error
   */
  getContactsCsv(metadata: types.GetContactsCsvMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/chat/contacts/csv', 'get', metadata);
  }

  /**
   * Returns a list with all integrations associated to an instance.
   *
   *
   * @summary Returns a list with all integration associated to an instance
   * @throws FetchError<400, types.GetIntegrationListResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.GetIntegrationListResponse500> Server error
   */
  getIntegrationList(metadata: types.GetIntegrationListMetadataParam): Promise<FetchResponse<200, types.GetIntegrationListResponse200>> {
    return this.core.fetch('/chat/integration', 'get', metadata);
  }

  /**
   * Create a new integration associated with an instance
   *
   *
   * @summary Create a new integration associated with an instance
   * @throws FetchError<400, types.PostIntegrationResponse400> Parameters missing or not in right format
   * @throws FetchError<409, types.PostIntegrationResponse409> Integration already exists
   * @throws FetchError<500, types.PostIntegrationResponse500> Server error
   */
  postIntegration(body: types.PostIntegrationBodyParam, metadata: types.PostIntegrationMetadataParam): Promise<FetchResponse<200, types.PostIntegrationResponse200>> {
    return this.core.fetch('/chat/integration', 'post', body, metadata);
  }

  /**
   * Edit a integration associated to an instance.
   * Only the parameters sent in the request will be replaced. The rest of the parameters
   * will not be modified.
   *
   *
   * @summary Edit a integration associated to an instance
   * @throws FetchError<400, types.PutIntegrationResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.PutIntegrationResponse500> Server error
   */
  putIntegration(body: types.PutIntegrationBodyParam, metadata: types.PutIntegrationMetadataParam): Promise<FetchResponse<200, types.PutIntegrationResponse200>> {
    return this.core.fetch('/chat/integration/{id}', 'put', body, metadata);
  }

  /**
   * Delete a integration associated with an instance
   *
   *
   * @summary Delete a integration associated with an instance
   * @throws FetchError<400, types.DeleteIntegrationResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.DeleteIntegrationResponse500> Server error
   */
  deleteIntegration(metadata: types.DeleteIntegrationMetadataParam): Promise<FetchResponse<200, types.DeleteIntegrationResponse200>> {
    return this.core.fetch('/chat/integration/{id}', 'delete', metadata);
  }

  /**
   * Returns a JSON with the stats of proactive messages between two dates.
   *
   *
   * @summary Get proactive messages stats
   * @throws FetchError<401, types.GetProactiveMessageStatsResponse401> Invalid credentials
   * @throws FetchError<500, types.GetProactiveMessageStatsResponse500> Server error
   */
  getProactiveMessageStats(metadata: types.GetProactiveMessageStatsMetadataParam): Promise<FetchResponse<200, types.GetProactiveMessageStatsResponse200>> {
    return this.core.fetch('/chat/message/proactive/stats', 'get', metadata);
  }

  /**
   * Returns a JSON with the stats of windows conversation (reactives, proactives &
   * referrals) between two dates.
   *
   *
   * @summary Get proactive messages stats
   * @throws FetchError<401, types.GetWindowConversationStatsResponse401> Invalid credentials
   * @throws FetchError<500, types.GetWindowConversationStatsResponse500> Server error
   */
  getWindowConversationStats(metadata: types.GetWindowConversationStatsMetadataParam): Promise<FetchResponse<200, types.GetWindowConversationStatsResponse200>> {
    return this.core.fetch('/chat/instance/windows/stats', 'get', metadata);
  }

  /**
   * Create a new  A/B testing .The test object must have the name of the test (**name**) and
   * the application's id (**applicationId**) and the filters that will be applied to the
   * campaigns that will form the test (**filters**).
   *
   * @summary add a new A/B testing
   * @throws FetchError<400, types.PostMultiTestResponse400> Parameters missing or not in right format
   * @throws FetchError<404, types.PostMultiTestResponse404> Application or device not found
   * @throws FetchError<500, types.PostMultiTestResponse500> Server error
   */
  postMultiTest(body: types.PostMultiTestBodyParam): Promise<FetchResponse<200, types.PostMultiTestResponse200>> {
    return this.core.fetch('/multiTest', 'post', body);
  }

  /**
   * Returns the multitest and test list
   *
   * @throws FetchError<400, types.GetMultitestAllResponse400> Parameters missing or not in right format
   * @throws FetchError<404, types.GetMultitestAllResponse404> Application or device not found
   * @throws FetchError<500, types.GetMultitestAllResponse500> Server error
   */
  getMultitestAll(metadata: types.GetMultitestAllMetadataParam): Promise<FetchResponse<200, types.GetMultitestAllResponse200>> {
    return this.core.fetch('/multiTest', 'get', metadata);
  }

  /**
   * Check if the test you want to create is valid to apply the multitest
   *
   * @summary Check for multitest
   * @throws FetchError<400, types.CheckMultitestResponse400> Parameters missing or not in right format
   * @throws FetchError<404, types.CheckMultitestResponse404> Application or device not found
   * @throws FetchError<500, types.CheckMultitestResponse500> Server error
   */
  checkMultitest(body: types.CheckMultitestBodyParam): Promise<FetchResponse<200, types.CheckMultitestResponse200>> {
    return this.core.fetch('/multiTest/check', 'post', body);
  }

  /**
   * Prepare and send a test to perform the multitest
   *
   * @summary Prepare and send multitest
   * @throws FetchError<400, types.SendMultiTestResponse400> Parameters missing or not in right format
   * @throws FetchError<404, types.SendMultiTestResponse404> Application or device not found
   * @throws FetchError<500, types.SendMultiTestResponse500> Server error
   */
  sendMultiTest(metadata: types.SendMultiTestMetadataParam): Promise<FetchResponse<200, types.SendMultiTestResponse200>> {
    return this.core.fetch('/multiTest/{id}/send', 'post', metadata);
  }

  /**
   * Cancel the multitest's send
   *
   * @summary Cancel the multitest's send
   * @throws FetchError<400, types.MultiTestCancelResponse400> Parameters missing or not in right format
   * @throws FetchError<404, types.MultiTestCancelResponse404> Application or device not found
   * @throws FetchError<500, types.MultiTestCancelResponse500> Server error
   */
  multiTestCancel(metadata: types.MultiTestCancelMetadataParam): Promise<FetchResponse<200, types.MultiTestCancelResponse200>> {
    return this.core.fetch('/multiTest/{id}/cancel', 'post', metadata);
  }

  /**
   * Returns the status of the multitest
   *
   * @throws FetchError<400, types.PutMultiTestResponse400> Parameters missing or not in right format
   * @throws FetchError<404, types.PutMultiTestResponse404> Application or device not found
   */
  putMultiTest(body: types.PutMultiTestBodyParam, metadata: types.PutMultiTestMetadataParam): Promise<FetchResponse<200, types.PutMultiTestResponse200>> {
    return this.core.fetch('/multiTest/{id}', 'put', body, metadata);
  }

  /**
   * Returns the status of the multitest
   *
   * @throws FetchError<400, types.GetMultiTestResponse400> Parameters missing or not in right format
   * @throws FetchError<404, types.GetMultiTestResponse404> Application or device not found
   */
  getMultiTest(metadata: types.GetMultiTestMetadataParam): Promise<FetchResponse<200, types.GetMultiTestResponse200>> {
    return this.core.fetch('/multiTest/{id}', 'get', metadata);
  }

  /**
   * delete the multitest
   *
   * @throws FetchError<400, types.DeleteMultiTestResponse400> Parameters missing or not in right format
   * @throws FetchError<404, types.DeleteMultiTestResponse404> Application or device not found
   * @throws FetchError<500, types.DeleteMultiTestResponse500> Server error
   */
  deleteMultiTest(metadata: types.DeleteMultiTestMetadataParam): Promise<FetchResponse<200, types.DeleteMultiTestResponse200>> {
    return this.core.fetch('/multiTest/{id}', 'delete', metadata);
  }

  /**
   * Shows the statistics of the Multi testing. 
   * Returns the name and other data of the Multi testing's campaigns data, indicating the
   * statistics for each of the this
   *
   * @summary Show  Multi testing stats with the given test's id
   * @throws FetchError<400, types.GetMultiTestStatsResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetMultiTestStatsResponse401> Invalid credentials
   * @throws FetchError<403, types.GetMultiTestStatsResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetMultiTestStatsResponse404> Campaign not found
   * @throws FetchError<500, types.GetMultiTestStatsResponse500> Server error
   */
  getMultiTestStats(metadata: types.GetMultiTestStatsMetadataParam): Promise<FetchResponse<200, types.GetMultiTestStatsResponse200>> {
    return this.core.fetch('/multiTest/{id}/stats', 'get', metadata);
  }

  /**
   * Returns the configuration of the inbox associated with an application.
   *
   * The application must be created before calling this method.
   *
   *
   * @summary Returns the configuration of the inbox associated with an application.
   * @throws FetchError<400, types.GetInboxConfigurationResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetInboxConfigurationResponse401> Invalid credentials
   * @throws FetchError<403, types.GetInboxConfigurationResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetInboxConfigurationResponse404> Application not found
   * @throws FetchError<500, types.GetInboxConfigurationResponse500> Server error
   */
  getInboxConfiguration(metadata: types.GetInboxConfigurationMetadataParam): Promise<FetchResponse<200, types.GetInboxConfigurationResponse200>> {
    return this.core.fetch('/inbox/{id}/config', 'get', metadata);
  }

  /**
   * Edit the inbox settings associated with an application.
   *
   * The application must be created before calling this method.
   *
   *
   * @summary Edit the inbox settings associated with an application.
   * @throws FetchError<400, types.SetInboxConfigurationResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.SetInboxConfigurationResponse401> Invalid credentials
   * @throws FetchError<403, types.SetInboxConfigurationResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.SetInboxConfigurationResponse404> Application not found
   * @throws FetchError<500, types.SetInboxConfigurationResponse500> Server error
   */
  setInboxConfiguration(body: types.SetInboxConfigurationBodyParam, metadata: types.SetInboxConfigurationMetadataParam): Promise<FetchResponse<200, types.SetInboxConfigurationResponse200>> {
    return this.core.fetch('/inbox/{id}/config', 'put', body, metadata);
  }

  /**
   * Returns a list with all the webhook content available for a specific instance.
   *
   * Id of the application (**applicationId**) is required
   *
   *
   * @summary Get a list of all webhook content
   * @throws FetchError<400, types.GetWebhookListResponse400> Parameters missing or not in right format
   * @throws FetchError<404, types.GetWebhookListResponse404> Webhook not found
   * @throws FetchError<500, types.GetWebhookListResponse500> Server error
   */
  getWebhookList(metadata: types.GetWebhookListMetadataParam): Promise<FetchResponse<200, types.GetWebhookListResponse200>> {
    return this.core.fetch('/chat/webhook', 'get', metadata);
  }

  /**
   * Creates a new webhook item
   *
   *
   * @summary Creates webhook item
   * @throws FetchError<400, types.PostWebhookResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.PostWebhookResponse500> Server error
   */
  postWebhook(body: types.PostWebhookBodyParam, metadata: types.PostWebhookMetadataParam): Promise<FetchResponse<200, types.PostWebhookResponse200>> {
    return this.core.fetch('/chat/webhook', 'post', body, metadata);
  }

  /**
   * Returns one webhook item by id
   *
   *
   * @summary Returns a webhook item
   * @throws FetchError<400, types.GetWebhookResponse400> Parameters missing or not in right format
   * @throws FetchError<404, types.GetWebhookResponse404> Webhook not found
   * @throws FetchError<500, types.GetWebhookResponse500> Server error
   */
  getWebhook(metadata: types.GetWebhookMetadataParam): Promise<FetchResponse<200, types.GetWebhookResponse200>> {
    return this.core.fetch('/chat/webhook/{id}', 'get', metadata);
  }

  /**
   * Edit an existing webhook item
   *
   *
   * @summary Edit an existing webhook item
   * @throws FetchError<400, types.PutWebhookResponse400> Parameters missing or not in right format
   * @throws FetchError<404, types.PutWebhookResponse404> Webhook not found
   * @throws FetchError<500, types.PutWebhookResponse500> Server error
   */
  putWebhook(body: types.PutWebhookBodyParam, metadata: types.PutWebhookMetadataParam): Promise<FetchResponse<200, types.PutWebhookResponse200>> {
    return this.core.fetch('/chat/webhook/{id}', 'put', body, metadata);
  }

  /**
   * Delete a webhook content.
   *
   * **Warning:** This method performs a physical erase, so **it is not possible to rescue
   * the deleted content** again.
   *
   * **Warning:** If this webhook content is deleted but there are **still references to it**
   * (for example, in a Dialogflow attempt) errors may occur during the sending of these
   * messages.
   *
   *
   * @summary Delete webhook content
   * @throws FetchError<400, types.DeleteWebhookResponse400> Parameters missing or not in right format
   * @throws FetchError<404, types.DeleteWebhookResponse404> Webhook not found
   * @throws FetchError<500, types.DeleteWebhookResponse500> Server error
   */
  deleteWebhook(metadata: types.DeleteWebhookMetadataParam): Promise<FetchResponse<200, types.DeleteWebhookResponse200>> {
    return this.core.fetch('/chat/webhook/{id}', 'delete', metadata);
  }

  /**
   * Returns a list with all the conversation tags available for a specific instance.
   *
   * Id of the instance (**instanceId**) is required
   *
   *
   * @summary Get a list of all conversation tags
   * @throws FetchError<400, types.GetConversationTagListResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.GetConversationTagListResponse500> Server error
   */
  getConversationTagList(metadata: types.GetConversationTagListMetadataParam): Promise<FetchResponse<200, types.GetConversationTagListResponse200>> {
    return this.core.fetch('/chat/conversationtag', 'get', metadata);
  }

  /**
   * Creates a new conversation tag item
   *
   *
   * @summary Creates conversation tag item
   * @throws FetchError<400, types.PostConversationTagResponse400> Parameters missing or not in right format
   * @throws FetchError<409, types.PostConversationTagResponse409> Conflict. There is already a conversation tag associated in this instance with the same
   * title.
   * @throws FetchError<500, types.PostConversationTagResponse500> Server error
   */
  postConversationTag(body: types.PostConversationTagBodyParam, metadata: types.PostConversationTagMetadataParam): Promise<FetchResponse<200, types.PostConversationTagResponse200>> {
    return this.core.fetch('/chat/conversationtag', 'post', body, metadata);
  }

  /**
   * Edit an existing conversation tag item
   *
   *
   * @summary Edit an existing conversation tag item
   * @throws FetchError<400, types.EditConversationTagResponse400> Parameters missing or not in right format
   * @throws FetchError<404, types.EditConversationTagResponse404> Conversation tag not found
   * @throws FetchError<409, types.EditConversationTagResponse409> Conflict. There is already a conversation tag associated in this instance with the same
   * title.
   * @throws FetchError<500, types.EditConversationTagResponse500> Server error
   */
  editConversationTag(body: types.EditConversationTagBodyParam, metadata: types.EditConversationTagMetadataParam): Promise<FetchResponse<200, types.EditConversationTagResponse200>> {
    return this.core.fetch('/chat/conversationtag/{id}', 'put', body, metadata);
  }

  /**
   * Delete a conversation tag.
   *
   * This methord performs a logical delete.
   *
   *
   * @summary Delete conversation tag
   * @throws FetchError<400, types.DeleteConversationTagResponse400> Parameters missing or not in right format
   * @throws FetchError<404, types.DeleteConversationTagResponse404> Webhook not found
   * @throws FetchError<500, types.DeleteConversationTagResponse500> Server error
   */
  deleteConversationTag(metadata: types.DeleteConversationTagMetadataParam): Promise<FetchResponse<200, types.DeleteConversationTagResponse200>> {
    return this.core.fetch('/chat/conversationtag/{id}', 'delete', metadata);
  }

  /**
   * Returns statistics by date for conversations associated with agent system.
   *
   * @summary Get agent stats
   * @throws FetchError<400, types.GetAgentDateStatsResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.GetAgentDateStatsResponse500> Server error
   */
  getAgentDateStats(metadata: types.GetAgentDateStatsMetadataParam): Promise<FetchResponse<200, types.GetAgentDateStatsResponse200>> {
    return this.core.fetch('/chat/agent/dateStats', 'get', metadata);
  }

  /**
   * Returns a list with all the conversation tagas available for a specific instance.
   *
   * Id of the application (**applicationId**) is required
   *
   *
   * @summary Get a list of all conversation tags
   * @throws FetchError<400, types.GetPluginListResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.GetPluginListResponse500> Server error
   */
  getPluginList(metadata: types.GetPluginListMetadataParam): Promise<FetchResponse<200, types.GetPluginListResponse200>> {
    return this.core.fetch('/chat/plugin', 'get', metadata);
  }

  /**
   * Creates a new conversation tag item
   *
   *
   * @summary Creates conversation tag item
   * @throws FetchError<400, types.PostPluginResponse400> Parameters missing or not in right format
   * @throws FetchError<409, types.PostPluginResponse409> Conflict. There is already a conversation tag associated in this instance with the same
   * title.
   * @throws FetchError<500, types.PostPluginResponse500> Server error
   */
  postPlugin(body: types.PostPluginBodyParam, metadata: types.PostPluginMetadataParam): Promise<FetchResponse<200, types.PostPluginResponse200>> {
    return this.core.fetch('/chat/plugin', 'post', body, metadata);
  }

  /**
   * Edit an existing conversation tag item
   *
   *
   * @summary Edit an existing conversation tag item
   * @throws FetchError<400, types.EditPluginResponse400> Parameters missing or not in right format
   * @throws FetchError<404, types.EditPluginResponse404> Conversation tag not found
   * @throws FetchError<409, types.EditPluginResponse409> Conflict. There is already a conversation tag associated in this instance with the same
   * title.
   * @throws FetchError<500, types.EditPluginResponse500> Server error
   */
  editPlugin(body: types.EditPluginBodyParam, metadata: types.EditPluginMetadataParam): Promise<FetchResponse<200, types.EditPluginResponse200>> {
    return this.core.fetch('/chat/plugin/{id}', 'put', body, metadata);
  }

  /**
   * Delete a conversation tag.
   *
   * This methord performs a logical delete.
   *
   *
   * @summary Delete conversation tag
   * @throws FetchError<400, types.DeletePluginResponse400> Parameters missing or not in right format
   * @throws FetchError<404, types.DeletePluginResponse404> Webhook not found
   * @throws FetchError<500, types.DeletePluginResponse500> Server error
   */
  deletePlugin(metadata: types.DeletePluginMetadataParam): Promise<FetchResponse<200, types.DeletePluginResponse200>> {
    return this.core.fetch('/chat/plugin/{id}', 'delete', metadata);
  }

  /**
   * Change profile info in WhatsApp Channel
   *
   *
   * @summary Change profile info in WhatsApp Channel
   * @throws FetchError<400, types.PutWaProfileResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.PutWaProfileResponse500> Server error
   */
  putWaProfile(body: types.PutWaProfileBodyParam, metadata: types.PutWaProfileMetadataParam): Promise<FetchResponse<200, types.PutWaProfileResponse200>> {
    return this.core.fetch('/chat/whatsapp/profile', 'put', body, metadata);
  }

  /**
   * Get profile info in WhatsApp Channel
   *
   *
   * @summary Get profile info in WhatsApp Channel
   * @throws FetchError<400, types.GetWaProfileResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.GetWaProfileResponse500> Server error
   */
  getWaProfile(metadata: types.GetWaProfileMetadataParam): Promise<FetchResponse<200, types.GetWaProfileResponse200>> {
    return this.core.fetch('/chat/whatsapp/profile', 'get', metadata);
  }

  /**
   * The WhatsApp Business API Client will scale and crop uploaded profile photos to be a
   * square with a max edge of 640px and max size of 5MB before uploading to our servers.
   * Images with a height or width of less than 192px may cause issues when the resizing
   * occurs, because of this, an image size of 640x640 is recommended.
   *
   *
   * @summary Change profile photo in WhatsApp Channel
   * @throws FetchError<400, types.UploadWaProfilePhotoResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.UploadWaProfilePhotoResponse500> Server error
   */
  uploadWaProfilePhoto(body: types.UploadWaProfilePhotoBodyParam, metadata: types.UploadWaProfilePhotoMetadataParam): Promise<FetchResponse<200, types.UploadWaProfilePhotoResponse200>> {
    return this.core.fetch('/chat/whatsapp/profile/photo', 'post', body, metadata);
  }

  /**
   * Delete existing profile photo in WhatsApp Channel
   *
   *
   * @summary Delete existing profile photo in WhatsApp Channel
   * @throws FetchError<400, types.DeleteWaProfilePhotoResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.DeleteWaProfilePhotoResponse500> Server error
   */
  deleteWaProfilePhoto(metadata: types.DeleteWaProfilePhotoMetadataParam): Promise<FetchResponse<200, types.DeleteWaProfilePhotoResponse200>> {
    return this.core.fetch('/chat/whatsapp/profile/photo', 'delete', metadata);
  }

  /**
   * Retrieve existing profile photo in WhatsApp Channel
   *
   *
   * @summary Retrieve existing profile photo in WhatsApp Channel
   * @throws FetchError<400, types.GetWaProfilePhotoResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.GetWaProfilePhotoResponse500> Server error
   */
  getWaProfilePhoto(metadata: types.GetWaProfilePhotoMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/chat/whatsapp/profile/photo', 'get', metadata);
  }

  /**
   * Returns canned message list from an instance
   *
   * @summary Returns canned message list from an instance
   * @throws FetchError<400, types.GetAllCannedMessagesResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.GetAllCannedMessagesResponse500> Server error
   */
  getAllCannedMessages(metadata: types.GetAllCannedMessagesMetadataParam): Promise<FetchResponse<200, types.GetAllCannedMessagesResponse200>> {
    return this.core.fetch('/chat/cannedmessage', 'get', metadata);
  }

  /**
   * Create a new canned message associated with an instance
   *
   * @summary Create a new canned message associated with an instance
   * @throws FetchError<400, types.CreateCannedMessageResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.CreateCannedMessageResponse500> Server error
   */
  createCannedMessage(body: types.CreateCannedMessageBodyParam, metadata: types.CreateCannedMessageMetadataParam): Promise<FetchResponse<200, types.CreateCannedMessageResponse200>> {
    return this.core.fetch('/chat/cannedmessage', 'post', body, metadata);
  }

  /**
   * Edit a canned message associated to an instance
   *
   * @summary Edit a canned message associated to an instance
   * @throws FetchError<400, types.UpdateCannedMessageResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.UpdateCannedMessageResponse500> Server error
   */
  updateCannedMessage(body: types.UpdateCannedMessageBodyParam, metadata: types.UpdateCannedMessageMetadataParam): Promise<FetchResponse<200, types.UpdateCannedMessageResponse200>> {
    return this.core.fetch('/chat/cannedmessage/{id}', 'put', body, metadata);
  }

  /**
   * Delete a canned message associated with an instance
   *
   * @summary Delete a canned message associated with an instance
   * @throws FetchError<400, types.DeleteCannedMessageResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.DeleteCannedMessageResponse500> Server error
   */
  deleteCannedMessage(metadata: types.DeleteCannedMessageMetadataParam): Promise<FetchResponse<200, types.DeleteCannedMessageResponse200>> {
    return this.core.fetch('/chat/cannedmessage/{id}', 'delete', metadata);
  }

  /**
   * This method returns the most recommended feature for applicationId from ICC API.
   *
   *
   * @summary Returns the most recommended feature for applicationId
   * @throws FetchError<400, types.GetRecommendationsResponse400> Parameters missing or not in right format
   * @throws FetchError<403, types.GetRecommendationsResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetRecommendationsResponse404> Application not found
   * @throws FetchError<500, types.GetRecommendationsResponse500> Server error
   */
  getRecommendations(metadata: types.GetRecommendationsMetadataParam): Promise<FetchResponse<200, types.GetRecommendationsResponse200>> {
    return this.core.fetch('/application/{id}/recommend', 'get', metadata);
  }

  /**
   * Requests ICC API to stop recommending a feature for a certain application.
   *
   *
   * @summary Requests ICC API to stop recommending a feature for a certain application
   * @throws FetchError<400, types.IgnoreRecommendationResponse400> Parameters missing or not in right format
   * @throws FetchError<403, types.IgnoreRecommendationResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.IgnoreRecommendationResponse404> Application not found
   * @throws FetchError<500, types.IgnoreRecommendationResponse500> Server error
   */
  ignoreRecommendation(metadata: types.IgnoreRecommendationMetadataParam): Promise<FetchResponse<200, types.IgnoreRecommendationResponse200>> {
    return this.core.fetch('/application/{id}/recommend/{recommendation}/ignore', 'post', metadata);
  }

  /**
   * Returns a list of conversation session blocked in an instance
   *
   * @summary Returns a list of conversation session blocked in an instance
   * @throws FetchError<400, types.GetAllBlockedResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.GetAllBlockedResponse500> Server error
   */
  getAllBlocked(metadata: types.GetAllBlockedMetadataParam): Promise<FetchResponse<200, types.GetAllBlockedResponse200>> {
    return this.core.fetch('/chat/conversationsession/block', 'get', metadata);
  }

  /**
   * Block a list of conversation sessions
   * The messages that come from that conversation session will not be processed, so they
   * will not be reflected in the statistics.
   * One, and only one of these parameters must be set by object: conversationSessionId or
   * contactId + channel
   *
   *
   * @summary Block a list of conversation sessions
   * @throws FetchError<400, types.BlockConversationResponse400> Parameters missing or not in right format
   * @throws FetchError<409, types.BlockConversationResponse409> Conversation session is already locked
   * @throws FetchError<500, types.BlockConversationResponse500> Server error
   */
  blockConversation(body: types.BlockConversationBodyParam, metadata: types.BlockConversationMetadataParam): Promise<FetchResponse<200, types.BlockConversationResponse200>> {
    return this.core.fetch('/chat/conversationsession/block', 'post', body, metadata);
  }

  /**
   * Transfer media items stored in one instance to another
   * If the multimedia already exists in the target instance with the same code, the existing
   * multimedia element will be deleted
   *
   *
   * @summary Transfer media items stored in one instance to another
   * @throws FetchError<400, types.TransferMultimediaResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.TransferMultimediaResponse500> Server error
   */
  transferMultimedia(body: types.TransferMultimediaBodyParam): Promise<FetchResponse<200, types.TransferMultimediaResponse200>> {
    return this.core.fetch('/chat/multimediatransfer', 'post', body);
  }

  /**
   * Unblock a conversation session from instance
   * One, and only one of these parameters must be set by object: conversationSessionId or
   * contactId + channel
   *
   *
   * @summary Unblock a list of conversation sessions from instance
   * @throws FetchError<400, types.UnblockConversationResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.UnblockConversationResponse500> Server error
   */
  unblockConversation(body: types.UnblockConversationBodyParam, metadata: types.UnblockConversationMetadataParam): Promise<FetchResponse<200, types.UnblockConversationResponse200>> {
    return this.core.fetch('/chat/conversationsession/unblock', 'put', body, metadata);
  }

  /**
   * Obtain the sending identifier of the messages that were sent between the specified
   * dates.
   *
   * @summary Get sendings list
   * @throws FetchError<400, types.GetSendingsResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetSendingsResponse401> Invalid credentials
   * @throws FetchError<500, types.GetSendingsResponse500> Server error
   */
  getSendings(metadata: types.GetSendingsMetadataParam): Promise<FetchResponse<200, types.GetSendingsResponse200>> {
    return this.core.fetch('/chat/sending', 'get', metadata);
  }

  /**
   * Change the property 'cancelled'  to true by false or false by true  of the selected
   * sending. Only works if slicing is active.
   *
   * @summary Cancel a sending
   * @throws FetchError<400, types.UpdatedSendingCancelResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.UpdatedSendingCancelResponse401> Invalid credentials
   * @throws FetchError<403, types.UpdatedSendingCancelResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.UpdatedSendingCancelResponse404> Application not found
   * @throws FetchError<500, types.UpdatedSendingCancelResponse500> Server error
   */
  updatedSendingCancel(metadata: types.UpdatedSendingCancelMetadataParam): Promise<FetchResponse<200, types.UpdatedSendingCancelResponse200>> {
    return this.core.fetch('/chat/sending/{id}/cancel', 'put', metadata);
  }

  /**
   * Returns a CSV file with a sending messages stored in database.
   *
   * The file is generated 24 hours after the sending has been sent.
   *
   *
   * @summary Get messages of the specified sending
   * @throws FetchError<400, types.GetChatSendingMessagesCsvResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetChatSendingMessagesCsvResponse401> Invalid credentials
   * @throws FetchError<403, types.GetChatSendingMessagesCsvResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetChatSendingMessagesCsvResponse404> File not found
   * @throws FetchError<500, types.GetChatSendingMessagesCsvResponse500> Server error
   */
  getChatSendingMessagesCsv(metadata: types.GetChatSendingMessagesCsvMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/chat/sending/messages/csv', 'get', metadata);
  }

  /**
   * Gets all application projects
   *
   * @summary Gets all application projects
   * @throws FetchError<403, types.GetProjectsResponse403> Forbidden
   * @throws FetchError<404, types.GetProjectsResponse404> Project not found
   * @throws FetchError<500, types.GetProjectsResponse500> Server error
   */
  getProjects(metadata: types.GetProjectsMetadataParam): Promise<FetchResponse<200, types.GetProjectsResponse200>> {
    return this.core.fetch('/wallet/project', 'get', metadata);
  }

  /**
   * Creates a new project
   *
   * @summary Creates a new project
   * @throws FetchError<400, types.PostProjectResponse400> Invalid certificate credentials or invalid certificate
   * @throws FetchError<403, types.PostProjectResponse403> Forbidden
   * @throws FetchError<404, types.PostProjectResponse404> Project not found
   * @throws FetchError<409, types.PostProjectResponse409> Subdomain already exists
   * @throws FetchError<415, types.PostProjectResponse415> Invalid file type
   * @throws FetchError<500, types.PostProjectResponse500> Server error
   */
  postProject(body: types.PostProjectBodyParam, metadata: types.PostProjectMetadataParam): Promise<FetchResponse<201, types.PostProjectResponse201>>;
  postProject(metadata: types.PostProjectMetadataParam): Promise<FetchResponse<201, types.PostProjectResponse201>>;
  postProject(body?: types.PostProjectBodyParam | types.PostProjectMetadataParam, metadata?: types.PostProjectMetadataParam): Promise<FetchResponse<201, types.PostProjectResponse201>> {
    return this.core.fetch('/wallet/project', 'post', body, metadata);
  }

  /**
   * Gets one application project
   *
   * @summary Gets one application project
   * @throws FetchError<403, types.GetProjectResponse403> Forbidden
   * @throws FetchError<404, types.GetProjectResponse404> Project not found
   * @throws FetchError<500, types.GetProjectResponse500> Server error
   */
  getProject(metadata: types.GetProjectMetadataParam): Promise<FetchResponse<200, types.GetProjectResponse200>> {
    return this.core.fetch('/wallet/project/{id}', 'get', metadata);
  }

  /**
   * Deletes one application project
   *
   * @summary Deletes one application project
   * @throws FetchError<403, types.DeleteProjectResponse403> Forbidden
   * @throws FetchError<404, types.DeleteProjectResponse404> Project not found
   * @throws FetchError<500, types.DeleteProjectResponse500> Server error
   */
  deleteProject(metadata: types.DeleteProjectMetadataParam): Promise<FetchResponse<200, types.DeleteProjectResponse200>> {
    return this.core.fetch('/wallet/project/{id}', 'delete', metadata);
  }

  /**
   * Update one application project
   *
   * @summary Update one application project
   * @throws FetchError<403, types.PutProjectResponse403> Forbidden
   * @throws FetchError<404, types.PutProjectResponse404> Project not found
   * @throws FetchError<500, types.PutProjectResponse500> Server error
   */
  putProject(metadata: types.PutProjectMetadataParam): Promise<FetchResponse<200, types.PutProjectResponse200>> {
    return this.core.fetch('/wallet/project/{id}', 'put', metadata);
  }

  /**
   * Returns the form from an instance
   *
   * @summary Returns the form from an instance
   * @throws FetchError<400, types.GetFormResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.GetFormResponse500> Server error
   */
  getForm(metadata: types.GetFormMetadataParam): Promise<FetchResponse<200, types.GetFormResponse200>> {
    return this.core.fetch('/chat/form', 'get', metadata);
  }

  /**
   * Create a new form for an instance
   *
   * @summary Create a new form for an instance
   * @throws FetchError<400, types.CreateFormResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.CreateFormResponse500> Server error
   */
  createForm(body: types.CreateFormBodyParam, metadata: types.CreateFormMetadataParam): Promise<FetchResponse<200, types.CreateFormResponse200>> {
    return this.core.fetch('/chat/form', 'post', body, metadata);
  }

  /**
   * Update a form for an instance
   *
   * @summary Update a form for an instance
   * @throws FetchError<400, types.PutFormResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.PutFormResponse500> Server error
   */
  putForm(body: types.PutFormBodyParam, metadata: types.PutFormMetadataParam): Promise<FetchResponse<200, types.PutFormResponse200>> {
    return this.core.fetch('/chat/form', 'put', body, metadata);
  }

  /**
   * Delete a form associated with an instance
   *
   * @summary Delete a form associated with an instance
   * @throws FetchError<400, types.DeleteFormResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.DeleteFormResponse500> Server error
   */
  deleteForm(metadata: types.DeleteFormMetadataParam): Promise<FetchResponse<200, types.DeleteFormResponse200>> {
    return this.core.fetch('/chat/form', 'delete', metadata);
  }

  /**
   * Create a new form question
   *
   * @summary Create a new form question
   * @throws FetchError<400, types.CreateFormQuestionResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.CreateFormQuestionResponse500> Server error
   */
  createFormQuestion(body: types.CreateFormQuestionBodyParam, metadata: types.CreateFormQuestionMetadataParam): Promise<FetchResponse<200, types.CreateFormQuestionResponse200>> {
    return this.core.fetch('/chat/form/{id}/question', 'post', body, metadata);
  }

  /**
   * Update a form question for an instance
   *
   * @summary Update a form question for an instance
   * @throws FetchError<400, types.PutFormQuestionResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.PutFormQuestionResponse500> Server error
   */
  putFormQuestion(body: types.PutFormQuestionBodyParam, metadata: types.PutFormQuestionMetadataParam): Promise<FetchResponse<200, types.PutFormQuestionResponse200>> {
    return this.core.fetch('/chat/form/{formId}/question/{questionId}', 'put', body, metadata);
  }

  /**
   * Delete a form question
   *
   * @summary Delete a form question
   * @throws FetchError<400, types.DeleteFormQuestionResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.DeleteFormQuestionResponse500> Server error
   */
  deleteFormQuestion(metadata: types.DeleteFormQuestionMetadataParam): Promise<FetchResponse<200, types.DeleteFormQuestionResponse200>> {
    return this.core.fetch('/chat/form/{formId}/question/{questionId}', 'delete', metadata);
  }

  /**
   * Create a new form question option
   *
   * @summary Create a new form question option
   * @throws FetchError<400, types.CreateFormQuestionOptionResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.CreateFormQuestionOptionResponse500> Server error
   */
  createFormQuestionOption(body: types.CreateFormQuestionOptionBodyParam, metadata: types.CreateFormQuestionOptionMetadataParam): Promise<FetchResponse<200, types.CreateFormQuestionOptionResponse200>> {
    return this.core.fetch('/chat/form/{formId}/question/{questionId}/option', 'post', body, metadata);
  }

  /**
   * Update a form question option
   *
   * @summary Update a form question option
   * @throws FetchError<400, types.PutFormQuestionOptionResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.PutFormQuestionOptionResponse500> Server error
   */
  putFormQuestionOption(body: types.PutFormQuestionOptionBodyParam, metadata: types.PutFormQuestionOptionMetadataParam): Promise<FetchResponse<200, types.PutFormQuestionOptionResponse200>> {
    return this.core.fetch('/chat/form/{formId}/question/{questionId}/option/{optionId}', 'put', body, metadata);
  }

  /**
   * Delete a form question option
   *
   * @summary Delete a form question option
   * @throws FetchError<400, types.DeleteFormQuestionOptionResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.DeleteFormQuestionOptionResponse500> Server error
   */
  deleteFormQuestionOption(metadata: types.DeleteFormQuestionOptionMetadataParam): Promise<FetchResponse<200, types.DeleteFormQuestionOptionResponse200>> {
    return this.core.fetch('/chat/form/{formId}/question/{questionId}/option/{optionId}', 'delete', metadata);
  }

  /**
   * Returns a CSV file with a history of messages stored in database.
   *
   * It works similarly to `/chat/history/csv` but much faster as it
   * uses pre-generated CSV files.
   *
   *
   * @summary Get message history
   * @throws FetchError<400, types.GetMessageHistoryCsvByDateResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetMessageHistoryCsvByDateResponse401> Invalid credentials
   * @throws FetchError<403, types.GetMessageHistoryCsvByDateResponse403> Operation forbidden for your user
   * @throws FetchError<404, types.GetMessageHistoryCsvByDateResponse404> File not found
   * @throws FetchError<500, types.GetMessageHistoryCsvByDateResponse500> Server error
   */
  getMessageHistoryCsvByDate(metadata: types.GetMessageHistoryCsvByDateMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/chat/history/csv/byday', 'get', metadata);
  }

  /**
   * Change the chat configuration data related to an applicationId
   *
   *
   * @summary Edit an existing application chat configuration
   * @throws FetchError<400, types.PutChatConfigurationResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.PutChatConfigurationResponse401> Invalid credentials
   * @throws FetchError<460, types.PutChatConfigurationResponse460> Chat feature is not enabled in this account
   * @throws FetchError<500, types.PutChatConfigurationResponse500> Server error
   */
  putChatConfiguration(body: types.PutChatConfigurationBodyParam, metadata: types.PutChatConfigurationMetadataParam): Promise<FetchResponse<200, types.PutChatConfigurationResponse200>> {
    return this.core.fetch('/chat/configuration', 'put', body, metadata);
  }

  /**
   * Returns instance configuration
   *
   *
   * @summary Get an existing instance configuration data
   * @throws FetchError<400, types.GetChatConfigurationResponse400> Parameters missing or not in right format
   * @throws FetchError<401, types.GetChatConfigurationResponse401> Invalid credentials
   * @throws FetchError<460, types.GetChatConfigurationResponse460> Chat feature is not enabled in this account
   * @throws FetchError<500, types.GetChatConfigurationResponse500> Server error
   */
  getChatConfiguration(metadata: types.GetChatConfigurationMetadataParam): Promise<FetchResponse<200, types.GetChatConfigurationResponse200>> {
    return this.core.fetch('/chat/configuration', 'get', metadata);
  }

  /**
   * Create a new topic associated with an instance
   *
   * @summary Create a new topic for an instance
   * @throws FetchError<400, types.CreateTopicResponse400> Parameters missing or not in right format
   * @throws FetchError<409, types.CreateTopicResponse409> Topic already exists
   * @throws FetchError<500, types.CreateTopicResponse500> Server error
   */
  createTopic(body: types.CreateTopicBodyParam, metadata: types.CreateTopicMetadataParam): Promise<FetchResponse<200, types.CreateTopicResponse200>> {
    return this.core.fetch('/chat/topic', 'post', body, metadata);
  }

  /**
   * Get a topic list for an instance
   *
   * @summary Get a topic list for an instance
   * @throws FetchError<400, types.GetListTopicResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.GetListTopicResponse500> Server error
   */
  getListTopic(metadata: types.GetListTopicMetadataParam): Promise<FetchResponse<200, types.GetListTopicResponse200>> {
    return this.core.fetch('/chat/topic', 'get', metadata);
  }

  /**
   * Update topic associated with an instance
   *
   * @summary Update a topic for an instance
   * @throws FetchError<400, types.UpdateTopicResponse400> Parameters missing or not in right format
   * @throws FetchError<404, types.UpdateTopicResponse404> Topic not found
   * @throws FetchError<409, types.UpdateTopicResponse409> Topic already exists
   * @throws FetchError<500, types.UpdateTopicResponse500> Server error
   */
  updateTopic(body: types.UpdateTopicBodyParam, metadata: types.UpdateTopicMetadataParam): Promise<FetchResponse<200, types.UpdateTopicResponse200>>;
  updateTopic(metadata: types.UpdateTopicMetadataParam): Promise<FetchResponse<200, types.UpdateTopicResponse200>>;
  updateTopic(body?: types.UpdateTopicBodyParam | types.UpdateTopicMetadataParam, metadata?: types.UpdateTopicMetadataParam): Promise<FetchResponse<200, types.UpdateTopicResponse200>> {
    return this.core.fetch('/chat/topic/{id}', 'put', body, metadata);
  }

  /**
   * Get a single topic
   *
   * @summary Get a single topic
   * @throws FetchError<400, types.GetTopicResponse400> Parameters missing or not in right format
   * @throws FetchError<404, types.GetTopicResponse404> Topic not found
   * @throws FetchError<500, types.GetTopicResponse500> Server error
   */
  getTopic(metadata: types.GetTopicMetadataParam): Promise<FetchResponse<200, types.GetTopicResponse200>> {
    return this.core.fetch('/chat/topic/{id}', 'get', metadata);
  }

  /**
   * Delete a topic
   *
   * @summary Delete a topic
   * @throws FetchError<400, types.DeleteTopicResponse400> Parameters missing or not in right format
   * @throws FetchError<404, types.DeleteTopicResponse404> Topic not found
   * @throws FetchError<500, types.DeleteTopicResponse500> Server error
   */
  deleteTopic(metadata: types.DeleteTopicMetadataParam): Promise<FetchResponse<200, types.DeleteTopicResponse200>> {
    return this.core.fetch('/chat/topic/{id}', 'delete', metadata);
  }

  /**
   * subscribe the contacts of an instance
   *
   * @summary Bulk subscribe the contacts of an instance from a CSV file to the specified topic
   * @throws FetchError<400, types.SubscribeTopicCsvResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.SubscribeTopicCsvResponse500> Server error
   */
  subscribeTopicCSV(body: types.SubscribeTopicCsvBodyParam, metadata: types.SubscribeTopicCsvMetadataParam): Promise<FetchResponse<200, types.SubscribeTopicCsvResponse200>> {
    return this.core.fetch('/chat/topic/subscribe/csv', 'post', body, metadata);
  }

  /**
   * unsubscribe the contacts of an instance
   *
   * @summary Bulk unsubscribe the contacts of an instance from a CSV file to the specified topic
   * @throws FetchError<400, types.UnsubscribeTopicCsvResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.UnsubscribeTopicCsvResponse500> Server error
   */
  unsubscribeTopicCSV(body: types.UnsubscribeTopicCsvBodyParam, metadata: types.UnsubscribeTopicCsvMetadataParam): Promise<FetchResponse<200, types.UnsubscribeTopicCsvResponse200>> {
    return this.core.fetch('/chat/topic/unsubscribe/csv', 'post', body, metadata);
  }

  /**
   * subscribe the contacts of an instance
   *
   * @summary Bulk subscribe the contacts of an instance from a JSON to the specified topic
   * @throws FetchError<400, types.SubscribeTopicJsonResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.SubscribeTopicJsonResponse500> Server error
   */
  subscribeTopicJSON(body: types.SubscribeTopicJsonBodyParam, metadata: types.SubscribeTopicJsonMetadataParam): Promise<FetchResponse<200, types.SubscribeTopicJsonResponse200>>;
  subscribeTopicJSON(metadata: types.SubscribeTopicJsonMetadataParam): Promise<FetchResponse<200, types.SubscribeTopicJsonResponse200>>;
  subscribeTopicJSON(body?: types.SubscribeTopicJsonBodyParam | types.SubscribeTopicJsonMetadataParam, metadata?: types.SubscribeTopicJsonMetadataParam): Promise<FetchResponse<200, types.SubscribeTopicJsonResponse200>> {
    return this.core.fetch('/chat/topic/subscribe/json', 'post', body, metadata);
  }

  /**
   * unsubscribe the contacts of an instance
   *
   * @summary Bulk unsubscribe the contacts of an instance from a JSON to the specified topic
   * @throws FetchError<400, types.UnsubscribeTopicJsonResponse400> Parameters missing or not in right format
   * @throws FetchError<500, types.UnsubscribeTopicJsonResponse500> Server error
   */
  unsubscribeTopicJSON(body: types.UnsubscribeTopicJsonBodyParam, metadata: types.UnsubscribeTopicJsonMetadataParam): Promise<FetchResponse<200, types.UnsubscribeTopicJsonResponse200>>;
  unsubscribeTopicJSON(metadata: types.UnsubscribeTopicJsonMetadataParam): Promise<FetchResponse<200, types.UnsubscribeTopicJsonResponse200>>;
  unsubscribeTopicJSON(body?: types.UnsubscribeTopicJsonBodyParam | types.UnsubscribeTopicJsonMetadataParam, metadata?: types.UnsubscribeTopicJsonMetadataParam): Promise<FetchResponse<200, types.UnsubscribeTopicJsonResponse200>> {
    return this.core.fetch('/chat/topic/unsubscribe/json', 'post', body, metadata);
  }

  /**
   * Creates or updates new project configuration for apple
   *
   * @summary Creates or updates new project configuration for apple
   * @throws FetchError<400, types.PostProjectAppleConfigResponse400> Invalid certificate credentials or invalid certificate
   * @throws FetchError<403, types.PostProjectAppleConfigResponse403> Forbidden
   * @throws FetchError<404, types.PostProjectAppleConfigResponse404> Project not found
   * @throws FetchError<415, types.PostProjectAppleConfigResponse415> Invalid file type
   * @throws FetchError<500, types.PostProjectAppleConfigResponse500> Server error
   */
  postProjectAppleConfig(body: types.PostProjectAppleConfigBodyParam, metadata: types.PostProjectAppleConfigMetadataParam): Promise<FetchResponse<200, types.PostProjectAppleConfigResponse200>>;
  postProjectAppleConfig(metadata: types.PostProjectAppleConfigMetadataParam): Promise<FetchResponse<200, types.PostProjectAppleConfigResponse200>>;
  postProjectAppleConfig(body?: types.PostProjectAppleConfigBodyParam | types.PostProjectAppleConfigMetadataParam, metadata?: types.PostProjectAppleConfigMetadataParam): Promise<FetchResponse<200, types.PostProjectAppleConfigResponse200>> {
    return this.core.fetch('/wallet/project/{id}/config/apple', 'put', body, metadata);
  }

  /**
   * Adds certificate files for one application's id
   *
   * @summary Deletes Apple certificate files for one application's id
   * @throws FetchError<403, types.DeleteProjectAppleConfigResponse403> Forbidden
   * @throws FetchError<404, types.DeleteProjectAppleConfigResponse404> Project not found
   * @throws FetchError<500, types.DeleteProjectAppleConfigResponse500> Server error
   */
  deleteProjectAppleConfig(metadata: types.DeleteProjectAppleConfigMetadataParam): Promise<FetchResponse<200, types.DeleteProjectAppleConfigResponse200>> {
    return this.core.fetch('/wallet/project/{id}/config/apple', 'delete', metadata);
  }

  /**
   * Creates or updates new project configuration for google
   *
   * @summary Creates or updates new project configuration for google
   * @throws FetchError<403, types.PostProjectGoogleConfigResponse403> Forbidden
   * @throws FetchError<404, types.PostProjectGoogleConfigResponse404> Project not found
   * @throws FetchError<415, types.PostProjectGoogleConfigResponse415> Invalid file type
   * @throws FetchError<500, types.PostProjectGoogleConfigResponse500> Server error
   */
  postProjectGoogleConfig(body: types.PostProjectGoogleConfigBodyParam, metadata: types.PostProjectGoogleConfigMetadataParam): Promise<FetchResponse<200, types.PostProjectGoogleConfigResponse200>>;
  postProjectGoogleConfig(metadata: types.PostProjectGoogleConfigMetadataParam): Promise<FetchResponse<200, types.PostProjectGoogleConfigResponse200>>;
  postProjectGoogleConfig(body?: types.PostProjectGoogleConfigBodyParam | types.PostProjectGoogleConfigMetadataParam, metadata?: types.PostProjectGoogleConfigMetadataParam): Promise<FetchResponse<200, types.PostProjectGoogleConfigResponse200>> {
    return this.core.fetch('/wallet/project/{id}/config/google', 'put', body, metadata);
  }

  /**
   * Deletes google json config files for one application's id
   *
   * @summary Deletes google json config files for one application's id
   * @throws FetchError<403, types.DeleteProjectGoogleConfigResponse403> Forbidden
   * @throws FetchError<404, types.DeleteProjectGoogleConfigResponse404> Project not found
   * @throws FetchError<500, types.DeleteProjectGoogleConfigResponse500> Server error
   */
  deleteProjectGoogleConfig(metadata: types.DeleteProjectGoogleConfigMetadataParam): Promise<FetchResponse<200, types.DeleteProjectGoogleConfigResponse200>> {
    return this.core.fetch('/wallet/project/{id}/config/google', 'delete', metadata);
  }

  /**
   * Gets stats for one project by its id
   *
   * @summary Gets stats for one project by its id
   * @throws FetchError<403, types.GetProjectStatsResponse403> Forbidden
   * @throws FetchError<404, types.GetProjectStatsResponse404> Project not found
   * @throws FetchError<500, types.GetProjectStatsResponse500> Server error
   */
  getProjectStats(metadata: types.GetProjectStatsMetadataParam): Promise<FetchResponse<200, types.GetProjectStatsResponse200>> {
    return this.core.fetch('/wallet/project/{id}/stats', 'get', metadata);
  }

  /**
   * Gets all templates for one project
   *
   * @summary Gets all templates for one project
   * @throws FetchError<403, types.GetTemplatesResponse403> Forbidden
   * @throws FetchError<404, types.GetTemplatesResponse404> Project not found
   * @throws FetchError<500, types.GetTemplatesResponse500> Server error
   */
  getTemplates(metadata: types.GetTemplatesMetadataParam): Promise<FetchResponse<200, types.GetTemplatesResponse200>> {
    return this.core.fetch('/wallet/template', 'get', metadata);
  }

  /**
   * Creates a new template
   *
   * @summary Creates a new template
   * @throws FetchError<400, types.PostTemplateResponse400> Bad Request
   * @throws FetchError<403, types.PostTemplateResponse403> Forbidden
   * @throws FetchError<404, types.PostTemplateResponse404> Project not found
   * @throws FetchError<409, types.PostTemplateResponse409> This external id is already associated with this template
   * @throws FetchError<500, types.PostTemplateResponse500> Server error
   */
  postTemplate(body: types.PostTemplateBodyParam, metadata: types.PostTemplateMetadataParam): Promise<FetchResponse<201, types.PostTemplateResponse201>> {
    return this.core.fetch('/wallet/template', 'post', body, metadata);
  }

  /**
   * Gets one template by its id
   *
   * @summary Gets one template by its id
   * @throws FetchError<403, types.GetTemplateResponse403> Forbidden
   * @throws FetchError<404, types.GetTemplateResponse404> Project not found
   * @throws FetchError<500, types.GetTemplateResponse500> Server error
   */
  getTemplate(metadata: types.GetTemplateMetadataParam): Promise<FetchResponse<200, types.GetTemplateResponse200>> {
    return this.core.fetch('/wallet/template/{id}', 'get', metadata);
  }

  /**
   * Updates a template
   *
   * @summary Updates a template
   * @throws FetchError<403, types.PutTemplateResponse403> Forbidden
   * @throws FetchError<404, types.PutTemplateResponse404> Project not found
   * @throws FetchError<409, types.PutTemplateResponse409> This external id is already associated with this template
   * @throws FetchError<500, types.PutTemplateResponse500> Server error
   */
  putTemplate(body: types.PutTemplateBodyParam, metadata: types.PutTemplateMetadataParam): Promise<FetchResponse<200, types.PutTemplateResponse200>>;
  putTemplate(metadata: types.PutTemplateMetadataParam): Promise<FetchResponse<200, types.PutTemplateResponse200>>;
  putTemplate(body?: types.PutTemplateBodyParam | types.PutTemplateMetadataParam, metadata?: types.PutTemplateMetadataParam): Promise<FetchResponse<200, types.PutTemplateResponse200>> {
    return this.core.fetch('/wallet/template/{id}', 'put', body, metadata);
  }

  /**
   * Deletes a template
   *
   * @summary Deletes a template
   * @throws FetchError<403, types.DeleteTemplateResponse403> Forbidden
   * @throws FetchError<404, types.DeleteTemplateResponse404> Project not found
   * @throws FetchError<500, types.DeleteTemplateResponse500> Server error
   */
  deleteTemplate(metadata: types.DeleteTemplateMetadataParam): Promise<FetchResponse<200, types.DeleteTemplateResponse200>> {
    return this.core.fetch('/wallet/template/{id}', 'delete', metadata);
  }

  /**
   * Updates a template
   *
   * @summary Updates a template
   * @throws FetchError<400, types.PutAppleTemplateResponse400> Bad Request
   * @throws FetchError<403, types.PutAppleTemplateResponse403> Forbidden
   * @throws FetchError<404, types.PutAppleTemplateResponse404> Project not found
   * @throws FetchError<500, types.PutAppleTemplateResponse500> Server error
   */
  putAppleTemplate(body: types.PutAppleTemplateBodyParam, metadata: types.PutAppleTemplateMetadataParam): Promise<FetchResponse<200, types.PutAppleTemplateResponse200>> {
    return this.core.fetch('/wallet/template/{id}/apple', 'put', body, metadata);
  }

  /**
   * Updates a template
   *
   * @summary Updates a template
   * @throws FetchError<400, types.PutGoogleTemplateResponse400> Bad Request
   * @throws FetchError<403, types.PutGoogleTemplateResponse403> Forbidden
   * @throws FetchError<404, types.PutGoogleTemplateResponse404> Project not found
   * @throws FetchError<500, types.PutGoogleTemplateResponse500> Server error
   */
  putGoogleTemplate(body: types.PutGoogleTemplateBodyParam, metadata: types.PutGoogleTemplateMetadataParam): Promise<FetchResponse<200, types.PutGoogleTemplateResponse200>>;
  putGoogleTemplate(metadata: types.PutGoogleTemplateMetadataParam): Promise<FetchResponse<200, types.PutGoogleTemplateResponse200>>;
  putGoogleTemplate(body?: types.PutGoogleTemplateBodyParam | types.PutGoogleTemplateMetadataParam, metadata?: types.PutGoogleTemplateMetadataParam): Promise<FetchResponse<200, types.PutGoogleTemplateResponse200>> {
    return this.core.fetch('/wallet/template/{id}/google', 'put', body, metadata);
  }

  /**
   * Gets stats for one template by its id
   *
   * @summary Gets stats for one template by its id
   * @throws FetchError<403, types.GetTemplateStatsResponse403> Forbidden
   * @throws FetchError<404, types.GetTemplateStatsResponse404> Template not found
   * @throws FetchError<500, types.GetTemplateStatsResponse500> Server error
   */
  getTemplateStats(metadata: types.GetTemplateStatsMetadataParam): Promise<FetchResponse<200, types.GetTemplateStatsResponse200>> {
    return this.core.fetch('/wallet/template/{id}/stats', 'get', metadata);
  }

  /**
   * Gets one template by its externalId
   *
   * @summary Gets one template by its externalId
   * @throws FetchError<403, types.GetTemplateByExternalIdResponse403> Forbidden
   * @throws FetchError<404, types.GetTemplateByExternalIdResponse404> Project not found
   * @throws FetchError<500, types.GetTemplateByExternalIdResponse500> Server error
   */
  getTemplateByExternalId(metadata: types.GetTemplateByExternalIdMetadataParam): Promise<FetchResponse<200, types.GetTemplateByExternalIdResponse200>> {
    return this.core.fetch('/wallet/template/external/{externalId}', 'get', metadata);
  }

  /**
   * Updates a template
   *
   * @summary Updates a template
   * @throws FetchError<403, types.PutTemplateByExternalIdResponse403> Forbidden
   * @throws FetchError<404, types.PutTemplateByExternalIdResponse404> Project not found
   * @throws FetchError<409, types.PutTemplateByExternalIdResponse409> This external id is already associated with this template
   * @throws FetchError<500, types.PutTemplateByExternalIdResponse500> Server error
   */
  putTemplateByExternalId(body: types.PutTemplateByExternalIdBodyParam, metadata: types.PutTemplateByExternalIdMetadataParam): Promise<FetchResponse<200, types.PutTemplateByExternalIdResponse200>>;
  putTemplateByExternalId(metadata: types.PutTemplateByExternalIdMetadataParam): Promise<FetchResponse<200, types.PutTemplateByExternalIdResponse200>>;
  putTemplateByExternalId(body?: types.PutTemplateByExternalIdBodyParam | types.PutTemplateByExternalIdMetadataParam, metadata?: types.PutTemplateByExternalIdMetadataParam): Promise<FetchResponse<200, types.PutTemplateByExternalIdResponse200>> {
    return this.core.fetch('/wallet/template/external/{externalId}', 'put', body, metadata);
  }

  /**
   * Deletes a template
   *
   * @summary Deletes a template
   * @throws FetchError<403, types.DeleteTemplateByExternalIdResponse403> Forbidden
   * @throws FetchError<404, types.DeleteTemplateByExternalIdResponse404> Project not found
   * @throws FetchError<500, types.DeleteTemplateByExternalIdResponse500> Server error
   */
  deleteTemplateByExternalId(metadata: types.DeleteTemplateByExternalIdMetadataParam): Promise<FetchResponse<200, types.DeleteTemplateByExternalIdResponse200>> {
    return this.core.fetch('/wallet/template/external/{externalId}', 'delete', metadata);
  }

  /**
   * Gets stats for one template by its externalId
   *
   * @summary Gets stats for one template by its externalId
   * @throws FetchError<403, types.GetTemplateStatsByExternalIdResponse403> Forbidden
   * @throws FetchError<404, types.GetTemplateStatsByExternalIdResponse404> Template not found
   * @throws FetchError<500, types.GetTemplateStatsByExternalIdResponse500> Server error
   */
  getTemplateStatsByExternalId(metadata: types.GetTemplateStatsByExternalIdMetadataParam): Promise<FetchResponse<200, types.GetTemplateStatsByExternalIdResponse200>> {
    return this.core.fetch('/wallet/template/external/{externalId}/stats', 'get', metadata);
  }

  /**
   * Updates a template
   *
   * @summary Updates a template
   * @throws FetchError<400, types.PutAppleTemplateByExternalIdResponse400> Bad Request
   * @throws FetchError<403, types.PutAppleTemplateByExternalIdResponse403> Forbidden
   * @throws FetchError<404, types.PutAppleTemplateByExternalIdResponse404> Project not found
   * @throws FetchError<500, types.PutAppleTemplateByExternalIdResponse500> Server error
   */
  putAppleTemplateByExternalId(body: types.PutAppleTemplateByExternalIdBodyParam, metadata: types.PutAppleTemplateByExternalIdMetadataParam): Promise<FetchResponse<200, types.PutAppleTemplateByExternalIdResponse200>> {
    return this.core.fetch('/wallet/template/external/{externalId}/apple', 'put', body, metadata);
  }

  /**
   * Updates a template
   *
   * @summary Updates a template
   * @throws FetchError<400, types.PutGoogleTemplateByExternalIdResponse400> Bad Request
   * @throws FetchError<403, types.PutGoogleTemplateByExternalIdResponse403> Forbidden
   * @throws FetchError<404, types.PutGoogleTemplateByExternalIdResponse404> Project not found
   * @throws FetchError<500, types.PutGoogleTemplateByExternalIdResponse500> Server error
   */
  putGoogleTemplateByExternalId(body: types.PutGoogleTemplateByExternalIdBodyParam, metadata: types.PutGoogleTemplateByExternalIdMetadataParam): Promise<FetchResponse<200, types.PutGoogleTemplateByExternalIdResponse200>>;
  putGoogleTemplateByExternalId(metadata: types.PutGoogleTemplateByExternalIdMetadataParam): Promise<FetchResponse<200, types.PutGoogleTemplateByExternalIdResponse200>>;
  putGoogleTemplateByExternalId(body?: types.PutGoogleTemplateByExternalIdBodyParam | types.PutGoogleTemplateByExternalIdMetadataParam, metadata?: types.PutGoogleTemplateByExternalIdMetadataParam): Promise<FetchResponse<200, types.PutGoogleTemplateByExternalIdResponse200>> {
    return this.core.fetch('/wallet/template/external/{externalId}/google', 'put', body, metadata);
  }

  /**
   * Adds an image to the given template's id
   *
   *
   * @summary Adds an image to the given template's id
   * @throws FetchError<400, types.PostTemplateImageResponse400> Bad request
   * @throws FetchError<403, types.PostTemplateImageResponse403> Forbidden
   * @throws FetchError<404, types.PostTemplateImageResponse404> Template not found
   * @throws FetchError<500, types.PostTemplateImageResponse500> Server error
   */
  postTemplateImage(body: types.PostTemplateImageBodyParam, metadata: types.PostTemplateImageMetadataParam): Promise<FetchResponse<200, types.PostTemplateImageResponse200>> {
    return this.core.fetch('/wallet/template/{id}/image', 'post', body, metadata);
  }

  /**
   * Adds an image to the given template's id
   *
   *
   * @summary Adds an image to the given template's id
   * @throws FetchError<400, types.PostTemplateImageByExternalIdResponse400> Bad request
   * @throws FetchError<403, types.PostTemplateImageByExternalIdResponse403> Forbidden
   * @throws FetchError<404, types.PostTemplateImageByExternalIdResponse404> Template not found
   * @throws FetchError<500, types.PostTemplateImageByExternalIdResponse500> Server error
   */
  postTemplateImageByExternalId(body: types.PostTemplateImageByExternalIdBodyParam, metadata: types.PostTemplateImageByExternalIdMetadataParam): Promise<FetchResponse<200, types.PostTemplateImageByExternalIdResponse200>> {
    return this.core.fetch('/wallet/template/external/{externalId}/image', 'post', body, metadata);
  }

  /**
   * Gets all passes from one template in csv format
   *
   * @summary Gets all passes from one template in csv format
   * @throws FetchError<400, types.GetPassesCsvResponse400> Bad request
   * @throws FetchError<500, types.GetPassesCsvResponse500> Server error
   */
  getPassesCSV(metadata: types.GetPassesCsvMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/wallet/template/{templateCode}/passes', 'get', metadata);
  }

  /**
   * Gets all passes
   *
   * @summary Gets all passes
   * @throws FetchError<403, types.GetPassesResponse403> Forbidden
   * @throws FetchError<404, types.GetPassesResponse404> Template not found
   * @throws FetchError<500, types.GetPassesResponse500> Server error
   */
  getPasses(metadata?: types.GetPassesMetadataParam): Promise<FetchResponse<200, types.GetPassesResponse200>> {
    return this.core.fetch('/wallet/pass', 'get', metadata);
  }

  /**
   * Creates a new pass
   *
   * @summary Creates a new pass
   * @throws FetchError<400, types.PostPassResponse400> Bad Request
   * @throws FetchError<403, types.PostPassResponse403> Forbidden
   * @throws FetchError<404, types.PostPassResponse404> Template not found
   * @throws FetchError<409, types.PostPassResponse409> This external id is already associated with this pass
   * @throws FetchError<500, types.PostPassResponse500> Server error
   */
  postPass(body: types.PostPassBodyParam, metadata: types.PostPassMetadataParam): Promise<FetchResponse<201, types.PostPassResponse201>>;
  postPass(metadata: types.PostPassMetadataParam): Promise<FetchResponse<201, types.PostPassResponse201>>;
  postPass(body?: types.PostPassBodyParam | types.PostPassMetadataParam, metadata?: types.PostPassMetadataParam): Promise<FetchResponse<201, types.PostPassResponse201>> {
    return this.core.fetch('/wallet/pass', 'post', body, metadata);
  }

  /**
   * Creates passes from csv
   *
   * @summary Creates passes from csv
   * @throws FetchError<400, types.PostPassesCsvResponse400> Bad request
   * @throws FetchError<403, types.PostPassesCsvResponse403> Forbidden
   * @throws FetchError<404, types.PostPassesCsvResponse404> Project not found
   * @throws FetchError<500, types.PostPassesCsvResponse500> Server error
   */
  postPassesCSV(body: types.PostPassesCsvBodyParam, metadata: types.PostPassesCsvMetadataParam): Promise<FetchResponse<200, types.PostPassesCsvResponse200>> {
    return this.core.fetch('/wallet/pass/csv', 'post', body, metadata);
  }

  /**
   * Gets one pass by its id
   *
   * @summary Gets one pass by its id
   * @throws FetchError<403, types.GetPassResponse403> Forbidden
   * @throws FetchError<404, types.GetPassResponse404> Pass not found
   * @throws FetchError<500, types.GetPassResponse500> Server error
   */
  getPass(metadata: types.GetPassMetadataParam): Promise<FetchResponse<200, types.GetPassResponse200>> {
    return this.core.fetch('/wallet/pass/{id}', 'get', metadata);
  }

  /**
   * Updates a pass
   *
   * @summary Updates pass data
   * @throws FetchError<403, types.PutPassResponse403> Forbidden
   * @throws FetchError<404, types.PutPassResponse404> Pass not found
   * @throws FetchError<409, types.PutPassResponse409> This external id is already associated with this pass
   * @throws FetchError<500, types.PutPassResponse500> Server error
   */
  putPass(body: types.PutPassBodyParam, metadata: types.PutPassMetadataParam): Promise<FetchResponse<200, types.PutPassResponse200>>;
  putPass(metadata: types.PutPassMetadataParam): Promise<FetchResponse<200, types.PutPassResponse200>>;
  putPass(body?: types.PutPassBodyParam | types.PutPassMetadataParam, metadata?: types.PutPassMetadataParam): Promise<FetchResponse<200, types.PutPassResponse200>> {
    return this.core.fetch('/wallet/pass/{id}', 'put', body, metadata);
  }

  /**
   * Deletes pass
   *
   * @summary Deletes pass
   * @throws FetchError<403, types.DeletePassResponse403> Forbidden
   * @throws FetchError<404, types.DeletePassResponse404> Pass not found
   * @throws FetchError<500, types.DeletePassResponse500> Server error
   */
  deletePass(metadata: types.DeletePassMetadataParam): Promise<FetchResponse<200, types.DeletePassResponse200>> {
    return this.core.fetch('/wallet/pass/{id}', 'delete', metadata);
  }

  /**
   * Gets stats for one pass by its id
   *
   * @summary Gets stats for one pass by its id
   * @throws FetchError<403, types.GetPassStatsResponse403> Forbidden
   * @throws FetchError<404, types.GetPassStatsResponse404> Pass not found
   * @throws FetchError<500, types.GetPassStatsResponse500> Server error
   */
  getPassStats(metadata: types.GetPassStatsMetadataParam): Promise<FetchResponse<200, types.GetPassStatsResponse200>> {
    return this.core.fetch('/wallet/pass/{id}/stats', 'get', metadata);
  }

  /**
   * Gets one pass by its id
   *
   * @summary Gets one pass by its id
   * @throws FetchError<403, types.GetPassByExternalIdResponse403> Forbidden
   * @throws FetchError<404, types.GetPassByExternalIdResponse404> Pass not found
   * @throws FetchError<500, types.GetPassByExternalIdResponse500> Server error
   */
  getPassByExternalId(metadata: types.GetPassByExternalIdMetadataParam): Promise<FetchResponse<200, types.GetPassByExternalIdResponse200>> {
    return this.core.fetch('/wallet/pass/external/{externalId}', 'get', metadata);
  }

  /**
   * Updates a pass
   *
   * @summary Updates pass data
   * @throws FetchError<403, types.PutPassByExternalIdResponse403> Forbidden
   * @throws FetchError<404, types.PutPassByExternalIdResponse404> Pass not found
   * @throws FetchError<409, types.PutPassByExternalIdResponse409> This external id is already associated with this pass
   * @throws FetchError<500, types.PutPassByExternalIdResponse500> Server error
   */
  putPassByExternalId(body: types.PutPassByExternalIdBodyParam, metadata: types.PutPassByExternalIdMetadataParam): Promise<FetchResponse<200, types.PutPassByExternalIdResponse200>>;
  putPassByExternalId(metadata: types.PutPassByExternalIdMetadataParam): Promise<FetchResponse<200, types.PutPassByExternalIdResponse200>>;
  putPassByExternalId(body?: types.PutPassByExternalIdBodyParam | types.PutPassByExternalIdMetadataParam, metadata?: types.PutPassByExternalIdMetadataParam): Promise<FetchResponse<200, types.PutPassByExternalIdResponse200>> {
    return this.core.fetch('/wallet/pass/external/{externalId}', 'put', body, metadata);
  }

  /**
   * Deletes pass
   *
   * @summary Deletes pass
   * @throws FetchError<403, types.DeletePassByExternalIdResponse403> Forbidden
   * @throws FetchError<404, types.DeletePassByExternalIdResponse404> Pass not found
   * @throws FetchError<500, types.DeletePassByExternalIdResponse500> Server error
   */
  deletePassByExternalId(metadata: types.DeletePassByExternalIdMetadataParam): Promise<FetchResponse<200, types.DeletePassByExternalIdResponse200>> {
    return this.core.fetch('/wallet/pass/external/{externalId}', 'delete', metadata);
  }

  /**
   * Gets stats for one pass by its id
   *
   * @summary Gets stats for one pass by its id
   * @throws FetchError<403, types.GetPassStatsByExternalIdResponse403> Forbidden
   * @throws FetchError<404, types.GetPassStatsByExternalIdResponse404> Pass not found
   * @throws FetchError<500, types.GetPassStatsByExternalIdResponse500> Server error
   */
  getPassStatsByExternalId(metadata: types.GetPassStatsByExternalIdMetadataParam): Promise<FetchResponse<200, types.GetPassStatsByExternalIdResponse200>> {
    return this.core.fetch('/wallet/pass/external/{externalId}/stats', 'get', metadata);
  }
}

const createSDK = (() => { return new SDK(); })()
;

export default createSDK;

export type { AddInAppImageBodyParam, AddInAppImageMetadataParam, AddInAppImageResponse200, AddInAppImageResponse400, AddInAppImageResponse401, AddInAppImageResponse403, AddInAppImageResponse404, AddInAppImageResponse500, AddUserToGroupBodyParam, AddUserToGroupMetadataParam, AddUserToGroupResponse200, AddUserToGroupResponse400, AddUserToGroupResponse500, BlockConversationBodyParam, BlockConversationMetadataParam, BlockConversationResponse200, BlockConversationResponse400, BlockConversationResponse409, BlockConversationResponse500, CheckMultitestBodyParam, CheckMultitestResponse200, CheckMultitestResponse400, CheckMultitestResponse404, CheckMultitestResponse500, CheckResponse200, CheckResponse404, CheckResponse500, Configure360MetadataParam, Configure360Response200, Configure360Response400, Configure360Response401, Configure360Response403, Configure360Response500, CreateAgentGroupBodyParam, CreateAgentGroupMetadataParam, CreateAgentGroupResponse200, CreateAgentGroupResponse400, CreateAgentGroupResponse500, CreateCannedMessageBodyParam, CreateCannedMessageMetadataParam, CreateCannedMessageResponse200, CreateCannedMessageResponse400, CreateCannedMessageResponse500, CreateFormBodyParam, CreateFormMetadataParam, CreateFormQuestionBodyParam, CreateFormQuestionMetadataParam, CreateFormQuestionOptionBodyParam, CreateFormQuestionOptionMetadataParam, CreateFormQuestionOptionResponse200, CreateFormQuestionOptionResponse400, CreateFormQuestionOptionResponse500, CreateFormQuestionResponse200, CreateFormQuestionResponse400, CreateFormQuestionResponse500, CreateFormResponse200, CreateFormResponse400, CreateFormResponse500, CreateTopicBodyParam, CreateTopicMetadataParam, CreateTopicResponse200, CreateTopicResponse400, CreateTopicResponse409, CreateTopicResponse500, DeleteAgentGroupMetadataParam, DeleteAgentGroupResponse200, DeleteAgentGroupResponse400, DeleteAgentGroupResponse500, DeleteApplicationAreasBodyParam, DeleteApplicationAreasCsvBodyParam, DeleteApplicationAreasCsvMetadataParam, DeleteApplicationAreasCsvResponse200, DeleteApplicationAreasCsvResponse400, DeleteApplicationAreasCsvResponse401, DeleteApplicationAreasCsvResponse403, DeleteApplicationAreasCsvResponse404, DeleteApplicationAreasCsvResponse500, DeleteApplicationAreasMetadataParam, DeleteApplicationAreasResponse200, DeleteApplicationAreasResponse400, DeleteApplicationAreasResponse401, DeleteApplicationAreasResponse403, DeleteApplicationAreasResponse404, DeleteApplicationAreasResponse500, DeleteApplicationCategoryBodyParam, DeleteApplicationCategoryMetadataParam, DeleteApplicationCategoryResponse200, DeleteApplicationCategoryResponse400, DeleteApplicationCategoryResponse401, DeleteApplicationCategoryResponse403, DeleteApplicationCategoryResponse404, DeleteApplicationCategoryResponse500, DeleteApplicationExternalAppsBodyParam, DeleteApplicationExternalAppsMetadataParam, DeleteApplicationExternalAppsResponse200, DeleteApplicationExternalAppsResponse400, DeleteApplicationExternalAppsResponse401, DeleteApplicationExternalAppsResponse403, DeleteApplicationExternalAppsResponse404, DeleteApplicationExternalAppsResponse500, DeleteApplicationMetadataParam, DeleteApplicationResponse200, DeleteApplicationResponse400, DeleteApplicationResponse401, DeleteApplicationResponse403, DeleteApplicationResponse404, DeleteApplicationResponse500, DeleteApplicationTopicDevicesCsvBodyParam, DeleteApplicationTopicDevicesCsvMetadataParam, DeleteApplicationTopicDevicesCsvResponse200, DeleteApplicationTopicDevicesCsvResponse400, DeleteApplicationTopicDevicesCsvResponse401, DeleteApplicationTopicDevicesCsvResponse403, DeleteApplicationTopicDevicesCsvResponse404, DeleteApplicationTopicDevicesCsvResponse500, DeleteApplicationTopicDevicesListBodyParam, DeleteApplicationTopicDevicesListMetadataParam, DeleteApplicationTopicDevicesListResponse200, DeleteApplicationTopicDevicesListResponse400, DeleteApplicationTopicDevicesListResponse401, DeleteApplicationTopicDevicesListResponse403, DeleteApplicationTopicDevicesListResponse404, DeleteApplicationTopicDevicesListResponse500, DeleteApplicationTopicsBodyParam, DeleteApplicationTopicsMetadataParam, DeleteApplicationTopicsResponse200, DeleteApplicationTopicsResponse400, DeleteApplicationTopicsResponse401, DeleteApplicationTopicsResponse403, DeleteApplicationTopicsResponse404, DeleteApplicationTopicsResponse500, DeleteApplicationWebAnalyticBodyParam, DeleteApplicationWebAnalyticMetadataParam, DeleteApplicationWebAnalyticResponse200, DeleteApplicationWebAnalyticResponse400, DeleteApplicationWebAnalyticResponse401, DeleteApplicationWebAnalyticResponse403, DeleteApplicationWebAnalyticResponse404, DeleteApplicationWebAnalyticResponse500, DeleteCampaignMetadataParam, DeleteCampaignResponse200, DeleteCampaignResponse400, DeleteCampaignResponse401, DeleteCampaignResponse403, DeleteCampaignResponse404, DeleteCampaignResponse500, DeleteCannedMessageMetadataParam, DeleteCannedMessageResponse200, DeleteCannedMessageResponse400, DeleteCannedMessageResponse500, DeleteChannelMetadataParam, DeleteChannelResponse200, DeleteChannelResponse400, DeleteChannelResponse500, DeleteConversationTagMetadataParam, DeleteConversationTagResponse200, DeleteConversationTagResponse400, DeleteConversationTagResponse404, DeleteConversationTagResponse500, DeleteDeviceTopicMetadataParam, DeleteDeviceTopicResponse200, DeleteDeviceTopicResponse400, DeleteDeviceTopicResponse401, DeleteDeviceTopicResponse403, DeleteDeviceTopicResponse404, DeleteDeviceTopicResponse500, DeleteExternalAuthMetadataParam, DeleteExternalAuthResponse200, DeleteExternalAuthResponse400, DeleteExternalAuthResponse401, DeleteExternalAuthResponse403, DeleteExternalAuthResponse404, DeleteExternalAuthResponse500, DeleteFormMetadataParam, DeleteFormQuestionMetadataParam, DeleteFormQuestionOptionMetadataParam, DeleteFormQuestionOptionResponse200, DeleteFormQuestionOptionResponse400, DeleteFormQuestionOptionResponse500, DeleteFormQuestionResponse200, DeleteFormQuestionResponse400, DeleteFormQuestionResponse500, DeleteFormResponse200, DeleteFormResponse400, DeleteFormResponse500, DeleteInAppMetadataParam, DeleteInAppResponse200, DeleteInAppResponse400, DeleteInAppResponse401, DeleteInAppResponse403, DeleteInAppResponse404, DeleteInAppResponse500, DeleteInAppSchemaBodyParam, DeleteInAppSchemaMetadataParam, DeleteInAppSchemaResponse200, DeleteInAppSchemaResponse400, DeleteInAppSchemaResponse401, DeleteInAppSchemaResponse403, DeleteInAppSchemaResponse404, DeleteInAppSchemaResponse500, DeleteIntegratedUserMetadataParam, DeleteIntegratedUserResponse200, DeleteIntegratedUserResponse401, DeleteIntegratedUserResponse403, DeleteIntegratedUserResponse404, DeleteIntegratedUserResponse500, DeleteIntegrationMetadataParam, DeleteIntegrationResponse200, DeleteIntegrationResponse400, DeleteIntegrationResponse500, DeleteMultiTestMetadataParam, DeleteMultiTestResponse200, DeleteMultiTestResponse400, DeleteMultiTestResponse404, DeleteMultiTestResponse500, DeleteMultimediaMetadataParam, DeleteMultimediaResponse200, DeleteMultimediaResponse400, DeleteMultimediaResponse401, DeleteMultimediaResponse403, DeleteMultimediaResponse404, DeleteMultimediaResponse500, DeletePassByExternalIdMetadataParam, DeletePassByExternalIdResponse200, DeletePassByExternalIdResponse403, DeletePassByExternalIdResponse404, DeletePassByExternalIdResponse500, DeletePassMetadataParam, DeletePassResponse200, DeletePassResponse403, DeletePassResponse404, DeletePassResponse500, DeletePluginMetadataParam, DeletePluginResponse200, DeletePluginResponse400, DeletePluginResponse404, DeletePluginResponse500, DeleteProjectAppleConfigMetadataParam, DeleteProjectAppleConfigResponse200, DeleteProjectAppleConfigResponse403, DeleteProjectAppleConfigResponse404, DeleteProjectAppleConfigResponse500, DeleteProjectGoogleConfigMetadataParam, DeleteProjectGoogleConfigResponse200, DeleteProjectGoogleConfigResponse403, DeleteProjectGoogleConfigResponse404, DeleteProjectGoogleConfigResponse500, DeleteProjectMetadataParam, DeleteProjectResponse200, DeleteProjectResponse403, DeleteProjectResponse404, DeleteProjectResponse500, DeleteTemplateByExternalIdMetadataParam, DeleteTemplateByExternalIdResponse200, DeleteTemplateByExternalIdResponse403, DeleteTemplateByExternalIdResponse404, DeleteTemplateByExternalIdResponse500, DeleteTemplateMetadataParam, DeleteTemplateResponse200, DeleteTemplateResponse403, DeleteTemplateResponse404, DeleteTemplateResponse500, DeleteTestMetadataParam, DeleteTestResponse200, DeleteTestResponse400, DeleteTestResponse401, DeleteTestResponse403, DeleteTestResponse404, DeleteTestResponse500, DeleteTopicMetadataParam, DeleteTopicResponse200, DeleteTopicResponse400, DeleteTopicResponse404, DeleteTopicResponse500, DeleteUserMetadataParam, DeleteUserPermissionBodyParam, DeleteUserPermissionMetadataParam, DeleteUserPermissionResponse200, DeleteUserPermissionResponse400, DeleteUserPermissionResponse403, DeleteUserPermissionResponse404, DeleteUserPermissionResponse500, DeleteUserResponse200, DeleteUserResponse401, DeleteUserResponse403, DeleteUserResponse404, DeleteUserResponse500, DeleteWaProfilePhotoMetadataParam, DeleteWaProfilePhotoResponse200, DeleteWaProfilePhotoResponse400, DeleteWaProfilePhotoResponse500, DeleteWabaTemplateMetadataParam, DeleteWabaTemplateResponse200, DeleteWabaTemplateResponse400, DeleteWabaTemplateResponse403, DeleteWabaTemplateResponse500, DeleteWebhookMetadataParam, DeleteWebhookResponse200, DeleteWebhookResponse400, DeleteWebhookResponse404, DeleteWebhookResponse500, DownloadMultimediaMetadataParam, DownloadMultimediaResponse400, DownloadMultimediaResponse403, DownloadMultimediaResponse404, DownloadMultimediaResponse500, EditContactAttributesBodyParam, EditContactAttributesMetadataParam, EditContactAttributesResponse200, EditContactAttributesResponse400, EditContactAttributesResponse401, EditContactAttributesResponse500, EditConversationTagBodyParam, EditConversationTagMetadataParam, EditConversationTagResponse200, EditConversationTagResponse400, EditConversationTagResponse404, EditConversationTagResponse409, EditConversationTagResponse500, EditDevicesBulkBodyParam, EditDevicesBulkCsvBodyParam, EditDevicesBulkCsvMetadataParam, EditDevicesBulkCsvResponse200, EditDevicesBulkCsvResponse400, EditDevicesBulkCsvResponse401, EditDevicesBulkCsvResponse403, EditDevicesBulkCsvResponse500, EditDevicesBulkMetadataParam, EditDevicesBulkResponse200, EditDevicesBulkResponse400, EditDevicesBulkResponse401, EditDevicesBulkResponse403, EditDevicesBulkResponse500, EditPluginBodyParam, EditPluginMetadataParam, EditPluginResponse200, EditPluginResponse400, EditPluginResponse404, EditPluginResponse409, EditPluginResponse500, Generate360TokenBodyParam, Generate360TokenMetadataParam, Generate360TokenResponse200, Generate360TokenResponse400, Generate360TokenResponse401, Generate360TokenResponse403, Generate360TokenResponse500, Get2FaRefreshResponse200, GetAccountLogsMetadataParam, GetAccountLogsResponse200, GetAccountLogsResponse400, GetAccountLogsResponse404, GetAccountLogsResponse500, GetAccountPublicMetadataParam, GetAccountPublicResponse200, GetAccountPublicResponse400, GetAccountPublicResponse404, GetAccountPublicResponse500, GetAccountsMetadataParam, GetAccountsResponse200, GetAccountsResponse400, GetAccountsResponse404, GetAccountsResponse500, GetAgentDateStatsMetadataParam, GetAgentDateStatsResponse200, GetAgentDateStatsResponse400, GetAgentDateStatsResponse500, GetAgentsStatusMetadataParam, GetAgentsStatusResponse200, GetAgentsStatusResponse400, GetAgentsStatusResponse500, GetAllAgentGroupsMetadataParam, GetAllAgentGroupsResponse200, GetAllAgentGroupsResponse400, GetAllAgentGroupsResponse500, GetAllBlockedMetadataParam, GetAllBlockedResponse200, GetAllBlockedResponse400, GetAllBlockedResponse500, GetAllCannedMessagesMetadataParam, GetAllCannedMessagesResponse200, GetAllCannedMessagesResponse400, GetAllCannedMessagesResponse500, GetAllGroupsForOneAgentMetadataParam, GetAllGroupsForOneAgentResponse200, GetAllGroupsForOneAgentResponse400, GetAllGroupsForOneAgentResponse500, GetApplicationAreasCsvMetadataParam, GetApplicationAreasCsvResponse400, GetApplicationAreasCsvResponse401, GetApplicationAreasCsvResponse403, GetApplicationAreasCsvResponse404, GetApplicationAreasCsvResponse500, GetApplicationAreasMetadataParam, GetApplicationAreasResponse200, GetApplicationAreasResponse400, GetApplicationAreasResponse401, GetApplicationAreasResponse403, GetApplicationAreasResponse404, GetApplicationAreasResponse500, GetApplicationCategoryMetadataParam, GetApplicationCategoryResponse200, GetApplicationCategoryResponse400, GetApplicationCategoryResponse401, GetApplicationCategoryResponse403, GetApplicationCategoryResponse404, GetApplicationCategoryResponse500, GetApplicationDateStatsCsvMetadataParam, GetApplicationDateStatsCsvResponse400, GetApplicationDateStatsCsvResponse401, GetApplicationDateStatsCsvResponse403, GetApplicationDateStatsCsvResponse404, GetApplicationDateStatsCsvResponse500, GetApplicationDateStatsMetadataParam, GetApplicationDateStatsResponse200, GetApplicationDateStatsResponse400, GetApplicationDateStatsResponse401, GetApplicationDateStatsResponse403, GetApplicationDateStatsResponse404, GetApplicationDateStatsResponse500, GetApplicationExternalAppsMetadataParam, GetApplicationExternalAppsResponse200, GetApplicationExternalAppsResponse400, GetApplicationExternalAppsResponse401, GetApplicationExternalAppsResponse403, GetApplicationExternalAppsResponse404, GetApplicationExternalAppsResponse500, GetApplicationMetadataParam, GetApplicationResponse200, GetApplicationResponse400, GetApplicationResponse401, GetApplicationResponse403, GetApplicationResponse500, GetApplicationStatsByAccountMetadataParam, GetApplicationStatsByAccountResponse200, GetApplicationStatsByAccountResponse400, GetApplicationStatsByAccountResponse401, GetApplicationStatsByAccountResponse403, GetApplicationStatsByAccountResponse404, GetApplicationStatsByAccountResponse500, GetApplicationStatsByDevicesCsvMetadataParam, GetApplicationStatsByDevicesCsvResponse400, GetApplicationStatsByDevicesCsvResponse401, GetApplicationStatsByDevicesCsvResponse403, GetApplicationStatsByDevicesCsvResponse404, GetApplicationStatsByDevicesCsvResponse500, GetApplicationStatsByDevicesMetadataParam, GetApplicationStatsByDevicesResponse200, GetApplicationStatsByDevicesResponse400, GetApplicationStatsByDevicesResponse401, GetApplicationStatsByDevicesResponse403, GetApplicationStatsByDevicesResponse404, GetApplicationStatsByDevicesResponse500, GetApplicationStatsMetadataParam, GetApplicationStatsResponse200, GetApplicationStatsResponse400, GetApplicationStatsResponse401, GetApplicationStatsResponse403, GetApplicationStatsResponse404, GetApplicationStatsResponse500, GetApplicationTopicDevicesCsvMetadataParam, GetApplicationTopicDevicesCsvResponse400, GetApplicationTopicDevicesCsvResponse401, GetApplicationTopicDevicesCsvResponse403, GetApplicationTopicDevicesCsvResponse404, GetApplicationTopicDevicesCsvResponse500, GetApplicationTopicDevicesListMetadataParam, GetApplicationTopicDevicesListResponse200, GetApplicationTopicDevicesListResponse400, GetApplicationTopicDevicesListResponse401, GetApplicationTopicDevicesListResponse403, GetApplicationTopicDevicesListResponse404, GetApplicationTopicDevicesListResponse500, GetApplicationTopicsMetadataParam, GetApplicationTopicsResponse200, GetApplicationTopicsResponse400, GetApplicationTopicsResponse401, GetApplicationTopicsResponse403, GetApplicationTopicsResponse404, GetApplicationTopicsResponse500, GetApplicationWebAnalyticMetadataParam, GetApplicationWebAnalyticResponse200, GetApplicationWebAnalyticResponse400, GetApplicationWebAnalyticResponse401, GetApplicationWebAnalyticResponse403, GetApplicationWebAnalyticResponse404, GetApplicationWebAnalyticResponse500, GetAreaTagMetadataParam, GetAreaTagResponse200, GetAreaTagResponse400, GetAreaTagResponse401, GetAreaTagResponse403, GetAreaTagResponse404, GetAreaTagResponse500, GetCampaignDateStatsMetadataParam, GetCampaignDateStatsResponse200, GetCampaignDateStatsResponse400, GetCampaignDateStatsResponse401, GetCampaignDateStatsResponse403, GetCampaignDateStatsResponse404, GetCampaignDateStatsResponse500, GetCampaignMetadataParam, GetCampaignResponse200, GetCampaignResponse400, GetCampaignResponse401, GetCampaignResponse403, GetCampaignResponse404, GetCampaignResponse500, GetCampaignSendMetadataParam, GetCampaignSendResponse200, GetCampaignSendResponse400, GetCampaignSendResponse401, GetCampaignSendResponse403, GetCampaignSendResponse404, GetCampaignSendResponse500, GetCampaignStatsByIdMetadataParam, GetCampaignStatsByIdResponse200, GetCampaignStatsByIdResponse400, GetCampaignStatsByIdResponse401, GetCampaignStatsByIdResponse403, GetCampaignStatsByIdResponse404, GetCampaignStatsByIdResponse500, GetCampaignStatsCsvMetadataParam, GetCampaignStatsCsvResponse400, GetCampaignStatsCsvResponse401, GetCampaignStatsCsvResponse403, GetCampaignStatsCsvResponse404, GetCampaignStatsCsvResponse500, GetCampaignStatsEntityByIdMetadataParam, GetCampaignStatsEntityByIdResponse200, GetCampaignStatsEntityByIdResponse400, GetCampaignStatsEntityByIdResponse401, GetCampaignStatsEntityByIdResponse403, GetCampaignStatsEntityByIdResponse404, GetCampaignStatsEntityByIdResponse500, GetCampaignStatsMetadataParam, GetCampaignStatsResponse200, GetCampaignStatsResponse400, GetCampaignStatsResponse401, GetCampaignStatsResponse403, GetCampaignStatsResponse404, GetCampaignStatsResponse500, GetChannelListMetadataParam, GetChannelListResponse200, GetChannelListResponse400, GetChannelListResponse500, GetChatConfigurationMetadataParam, GetChatConfigurationResponse200, GetChatConfigurationResponse400, GetChatConfigurationResponse401, GetChatConfigurationResponse460, GetChatConfigurationResponse500, GetChatDateStatsMetadataParam, GetChatDateStatsResponse200, GetChatDateStatsResponse400, GetChatDateStatsResponse401, GetChatDateStatsResponse403, GetChatDateStatsResponse404, GetChatDateStatsResponse500, GetChatMetadataParam, GetChatResponse200, GetChatResponse400, GetChatResponse401, GetChatResponse500, GetChatSendingMessagesCsvMetadataParam, GetChatSendingMessagesCsvResponse400, GetChatSendingMessagesCsvResponse401, GetChatSendingMessagesCsvResponse403, GetChatSendingMessagesCsvResponse404, GetChatSendingMessagesCsvResponse500, GetChatStatsMetadataParam, GetChatStatsResponse200, GetChatStatsResponse400, GetChatStatsResponse401, GetChatStatsResponse403, GetChatStatsResponse404, GetChatStatsResponse500, GetChatTokenMetadataParam, GetChatTokenResponse200, GetChatTokenResponse400, GetChatTokenResponse401, GetChatTokenResponse403, GetChatTokenResponse404, GetChatTokenResponse500, GetCloudDistrictUserMetadataParam, GetCloudDistrictUserResponse200, GetCloudDistrictUserResponse401, GetCloudDistrictUserResponse404, GetCloudDistrictUserResponse500, GetContactsCsvMetadataParam, GetContactsCsvResponse401, GetContactsCsvResponse403, GetContactsCsvResponse404, GetContactsCsvResponse500, GetContactsMetadataParam, GetContactsResponse200, GetContactsResponse401, GetContactsResponse500, GetConversationTagListMetadataParam, GetConversationTagListResponse200, GetConversationTagListResponse400, GetConversationTagListResponse500, GetDeviceStatusPrecalcCsvDownloadMetadataParam, GetDeviceStatusPrecalcCsvDownloadResponse400, GetDeviceStatusPrecalcCsvDownloadResponse401, GetDeviceStatusPrecalcCsvDownloadResponse403, GetDeviceStatusPrecalcCsvDownloadResponse404, GetDeviceStatusPrecalcCsvDownloadResponse409, GetDeviceStatusPrecalcCsvDownloadResponse500, GetDeviceStatusPrecalcCsvMetadataParam, GetDeviceStatusPrecalcCsvResponse200, GetDeviceStatusPrecalcCsvResponse400, GetDeviceStatusPrecalcCsvResponse401, GetDeviceStatusPrecalcCsvResponse403, GetDeviceStatusPrecalcCsvResponse404, GetDeviceStatusPrecalcCsvResponse409, GetDeviceStatusPrecalcCsvResponse500, GetDevicesByExternalCodeMetadataParam, GetDevicesByExternalCodeResponse200, GetDevicesWithPushErrorCsvMetadataParam, GetDevicesWithPushErrorCsvResponse400, GetDevicesWithPushErrorCsvResponse401, GetDevicesWithPushErrorCsvResponse403, GetDevicesWithPushErrorCsvResponse404, GetDevicesWithPushErrorCsvResponse500, GetDevicesWithPushErrorMetadataParam, GetDevicesWithPushErrorResponse200, GetDevicesWithPushErrorResponse400, GetDevicesWithPushErrorResponse401, GetDevicesWithPushErrorResponse403, GetDevicesWithPushErrorResponse404, GetDevicesWithPushErrorResponse500, GetExternalAuthMetadataParam, GetExternalAuthResponse200, GetExternalAuthResponse400, GetExternalAuthResponse401, GetExternalAuthResponse403, GetExternalAuthResponse404, GetExternalAuthResponse500, GetFormMetadataParam, GetFormResponse200, GetFormResponse400, GetFormResponse500, GetHubspotUserMetadataParam, GetHubspotUserResponse200, GetHubspotUserResponse401, GetHubspotUserResponse404, GetHubspotUserResponse500, GetInAppMetadataParam, GetInAppResponse200, GetInAppResponse400, GetInAppResponse401, GetInAppResponse403, GetInAppResponse500, GetInAppSchemaListMetadataParam, GetInAppSchemaListResponse200, GetInAppSchemaListResponse400, GetInAppSchemaListResponse401, GetInAppSchemaListResponse403, GetInAppSchemaListResponse404, GetInAppSchemaListResponse500, GetInappStatsDownloadcsvMetadataParam, GetInappStatsDownloadcsvResponse400, GetInappStatsDownloadcsvResponse401, GetInappStatsDownloadcsvResponse403, GetInappStatsDownloadcsvResponse404, GetInappStatsDownloadcsvResponse500, GetInboxConfigurationMetadataParam, GetInboxConfigurationResponse200, GetInboxConfigurationResponse400, GetInboxConfigurationResponse401, GetInboxConfigurationResponse403, GetInboxConfigurationResponse404, GetInboxConfigurationResponse500, GetIntegratedUsersMetadataParam, GetIntegratedUsersResponse200, GetIntegratedUsersResponse400, GetIntegratedUsersResponse401, GetIntegratedUsersResponse403, GetIntegratedUsersResponse500, GetIntegrationListMetadataParam, GetIntegrationListResponse200, GetIntegrationListResponse400, GetIntegrationListResponse500, GetListOfReportsMetadataParam, GetListOfReportsResponse200, GetListOfReportsResponse400, GetListOfReportsResponse401, GetListOfReportsResponse403, GetListOfReportsResponse404, GetListOfReportsResponse500, GetListOfReportsResponse503, GetListTopicMetadataParam, GetListTopicResponse200, GetListTopicResponse400, GetListTopicResponse500, GetMessageHistoryCsvByDateMetadataParam, GetMessageHistoryCsvByDateResponse400, GetMessageHistoryCsvByDateResponse401, GetMessageHistoryCsvByDateResponse403, GetMessageHistoryCsvByDateResponse404, GetMessageHistoryCsvByDateResponse500, GetMessageHistoryCsvMetadataParam, GetMessageHistoryCsvResponse400, GetMessageHistoryCsvResponse401, GetMessageHistoryCsvResponse500, GetMultiTestMetadataParam, GetMultiTestResponse200, GetMultiTestResponse400, GetMultiTestResponse404, GetMultiTestStatsMetadataParam, GetMultiTestStatsResponse200, GetMultiTestStatsResponse400, GetMultiTestStatsResponse401, GetMultiTestStatsResponse403, GetMultiTestStatsResponse404, GetMultiTestStatsResponse500, GetMultimediaListMetadataParam, GetMultimediaListResponse200, GetMultimediaListResponse400, GetMultimediaListResponse403, GetMultimediaListResponse404, GetMultimediaListResponse500, GetMultimediaMetadataParam, GetMultimediaResponse200, GetMultimediaResponse400, GetMultimediaResponse403, GetMultimediaResponse404, GetMultimediaResponse500, GetMultitestAllMetadataParam, GetMultitestAllResponse200, GetMultitestAllResponse400, GetMultitestAllResponse404, GetMultitestAllResponse500, GetOmniWordCloudMetadataParam, GetOmniWordCloudResponse200, GetOmniWordCloudResponse400, GetOmniWordCloudResponse401, GetOmniWordCloudResponse403, GetOmniWordCloudResponse404, GetOmniWordCloudResponse500, GetPassByExternalIdMetadataParam, GetPassByExternalIdResponse200, GetPassByExternalIdResponse403, GetPassByExternalIdResponse404, GetPassByExternalIdResponse500, GetPassMetadataParam, GetPassResponse200, GetPassResponse403, GetPassResponse404, GetPassResponse500, GetPassStatsByExternalIdMetadataParam, GetPassStatsByExternalIdResponse200, GetPassStatsByExternalIdResponse403, GetPassStatsByExternalIdResponse404, GetPassStatsByExternalIdResponse500, GetPassStatsMetadataParam, GetPassStatsResponse200, GetPassStatsResponse403, GetPassStatsResponse404, GetPassStatsResponse500, GetPassesCsvMetadataParam, GetPassesCsvResponse400, GetPassesCsvResponse500, GetPassesMetadataParam, GetPassesResponse200, GetPassesResponse403, GetPassesResponse404, GetPassesResponse500, GetPluginListMetadataParam, GetPluginListResponse200, GetPluginListResponse400, GetPluginListResponse500, GetProactiveMessageStatsMetadataParam, GetProactiveMessageStatsResponse200, GetProactiveMessageStatsResponse401, GetProactiveMessageStatsResponse500, GetProjectMetadataParam, GetProjectResponse200, GetProjectResponse403, GetProjectResponse404, GetProjectResponse500, GetProjectStatsMetadataParam, GetProjectStatsResponse200, GetProjectStatsResponse403, GetProjectStatsResponse404, GetProjectStatsResponse500, GetProjectsMetadataParam, GetProjectsResponse200, GetProjectsResponse403, GetProjectsResponse404, GetProjectsResponse500, GetPushHeatmapMetadataParam, GetPushHeatmapResponse200, GetPushHeatmapResponse400, GetPushHeatmapResponse401, GetPushHeatmapResponse403, GetPushHeatmapResponse404, GetPushHeatmapResponse500, GetRecommendationsMetadataParam, GetRecommendationsResponse200, GetRecommendationsResponse400, GetRecommendationsResponse403, GetRecommendationsResponse404, GetRecommendationsResponse500, GetSalesForceUserMetadataParam, GetSalesForceUserResponse200, GetSalesForceUserResponse401, GetSalesForceUserResponse404, GetSalesForceUserResponse500, GetScheduledSendingsMetadataParam, GetScheduledSendingsResponse200, GetScheduledSendingsResponse400, GetScheduledSendingsResponse401, GetScheduledSendingsResponse403, GetScheduledSendingsResponse404, GetScheduledSendingsResponse500, GetSegmentationStatsMetadataParam, GetSegmentationStatsResponse200, GetSegmentationStatsResponse400, GetSegmentationStatsResponse401, GetSegmentationStatsResponse403, GetSegmentationStatsResponse404, GetSegmentationStatsResponse500, GetSegmentationStatsResponse503, GetSendIdStatsMetadataParam, GetSendIdStatsResponse200, GetSendIdStatsResponse400, GetSendIdStatsResponse401, GetSendIdStatsResponse403, GetSendIdStatsResponse404, GetSendIdStatsResponse500, GetSendingsMetadataParam, GetSendingsResponse200, GetSendingsResponse400, GetSendingsResponse401, GetSendingsResponse500, GetSfscCertificateMetadataParam, GetSfscCertificateResponse200, GetSfscCertificateResponse401, GetSfscCertificateResponse404, GetSfscCertificateResponse500, GetSfscUserMetadataParam, GetSfscUserResponse200, GetSfscUserResponse401, GetSfscUserResponse404, GetSfscUserResponse500, GetSingleApplicationMetadataParam, GetSingleApplicationResponse200, GetSingleApplicationResponse400, GetSingleApplicationResponse401, GetSingleApplicationResponse403, GetSingleApplicationResponse404, GetSingleApplicationResponse500, GetSingleCampaignMetadataParam, GetSingleCampaignResponse200, GetSingleCampaignResponse400, GetSingleCampaignResponse401, GetSingleCampaignResponse403, GetSingleCampaignResponse404, GetSingleCampaignResponse500, GetSingleInAppMetadataParam, GetSingleInAppResponse200, GetSingleInAppResponse400, GetSingleInAppResponse401, GetSingleInAppResponse403, GetSingleInAppResponse500, GetSingleUserMetadataParam, GetSingleUserResponse200, GetSingleUserResponseDefault, GetStatsFileByDateMetadataParam, GetStatsFileByDateResponse400, GetStatsFileByDateResponse401, GetStatsFileByDateResponse500, GetTemplateByExternalIdMetadataParam, GetTemplateByExternalIdResponse200, GetTemplateByExternalIdResponse403, GetTemplateByExternalIdResponse404, GetTemplateByExternalIdResponse500, GetTemplateMetadataParam, GetTemplateResponse200, GetTemplateResponse403, GetTemplateResponse404, GetTemplateResponse500, GetTemplateStatsByExternalIdMetadataParam, GetTemplateStatsByExternalIdResponse200, GetTemplateStatsByExternalIdResponse403, GetTemplateStatsByExternalIdResponse404, GetTemplateStatsByExternalIdResponse500, GetTemplateStatsMetadataParam, GetTemplateStatsResponse200, GetTemplateStatsResponse403, GetTemplateStatsResponse404, GetTemplateStatsResponse500, GetTemplatesMetadataParam, GetTemplatesResponse200, GetTemplatesResponse403, GetTemplatesResponse404, GetTemplatesResponse500, GetTestMetadataParam, GetTestResponse200, GetTestResponse400, GetTestResponse401, GetTestResponse403, GetTestResponse404, GetTestResponse500, GetTestStatsMetadataParam, GetTestStatsResponse200, GetTestStatsResponse400, GetTestStatsResponse401, GetTestStatsResponse403, GetTestStatsResponse404, GetTestStatsResponse500, GetTestsMetadataParam, GetTestsResponse200, GetTestsResponse400, GetTestsResponse401, GetTestsResponse403, GetTestsResponse404, GetTestsResponse500, GetTopicMetadataParam, GetTopicResponse200, GetTopicResponse400, GetTopicResponse404, GetTopicResponse500, GetUsersMetadataParam, GetUsersResponse200, GetUsersResponse400, GetUsersResponse401, GetUsersResponse403, GetUsersResponse500, GetWaProfileMetadataParam, GetWaProfilePhotoMetadataParam, GetWaProfilePhotoResponse400, GetWaProfilePhotoResponse500, GetWaProfileResponse200, GetWaProfileResponse400, GetWaProfileResponse500, GetWabaEcommerceSettingsMetadataParam, GetWabaEcommerceSettingsResponse200, GetWabaEcommerceSettingsResponse400, GetWabaEcommerceSettingsResponse500, GetWabaMetadataParam, GetWabaResponse200, GetWabaResponse400, GetWabaResponse403, GetWabaResponse500, GetWabaTemplatesMetadataParam, GetWabaTemplatesResponse200, GetWabaTemplatesResponse400, GetWabaTemplatesResponse401, GetWabaTemplatesResponse403, GetWabaTemplatesResponse500, GetWebRolesMetadataParam, GetWebRolesResponse200, GetWebRolesResponse401, GetWebRolesResponse404, GetWebRolesResponse500, GetWebhookListMetadataParam, GetWebhookListResponse200, GetWebhookListResponse400, GetWebhookListResponse404, GetWebhookListResponse500, GetWebhookMetadataParam, GetWebhookResponse200, GetWebhookResponse400, GetWebhookResponse404, GetWebhookResponse500, GetWindowConversationStatsMetadataParam, GetWindowConversationStatsResponse200, GetWindowConversationStatsResponse401, GetWindowConversationStatsResponse500, GetWordCloudMetadataParam, GetWordCloudResponse200, GetWordCloudResponse400, GetWordCloudResponse401, GetWordCloudResponse403, GetWordCloudResponse404, GetWordCloudResponse500, GetWordPressUsersResponse200, GetWordPressUsersResponse401, GetWordPressUsersResponse403, GetWordPressUsersResponse404, GetWordPressUsersResponse500, GetZapierUserMetadataParam, GetZapierUserResponse200, GetZapierUserResponse401, GetZapierUserResponse404, GetZapierUserResponse500, IgnoreRecommendationMetadataParam, IgnoreRecommendationResponse200, IgnoreRecommendationResponse400, IgnoreRecommendationResponse403, IgnoreRecommendationResponse404, IgnoreRecommendationResponse500, InAppDateStatsCsvMetadataParam, InAppDateStatsCsvResponse400, InAppDateStatsCsvResponse401, InAppDateStatsCsvResponse403, InAppDateStatsCsvResponse404, InAppDateStatsCsvResponse500, InAppDateStatsMetadataParam, InAppDateStatsResponse200, InAppDateStatsResponse400, InAppDateStatsResponse401, InAppDateStatsResponse403, InAppDateStatsResponse404, InAppDateStatsResponse500, InAppStatsByIdMetadataParam, InAppStatsByIdResponse200, InAppStatsByIdResponse400, InAppStatsByIdResponse401, InAppStatsByIdResponse403, InAppStatsByIdResponse404, InAppStatsByIdResponse500, InAppStatsMetadataParam, InAppStatsResponse200, InAppStatsResponse400, InAppStatsResponse401, InAppStatsResponse403, InAppStatsResponse404, InAppStatsResponse500, MultiTestCancelMetadataParam, MultiTestCancelResponse200, MultiTestCancelResponse400, MultiTestCancelResponse404, MultiTestCancelResponse500, Post2FaAuthBodyParam, Post2FaAuthResponse200, Post2FaAuthResponse401, Post2FaAuthResponse500, PostApplicationAreasBodyParam, PostApplicationAreasCsvBodyParam, PostApplicationAreasCsvMetadataParam, PostApplicationAreasCsvResponse200, PostApplicationAreasCsvResponse400, PostApplicationAreasCsvResponse401, PostApplicationAreasCsvResponse403, PostApplicationAreasCsvResponse404, PostApplicationAreasCsvResponse500, PostApplicationAreasMetadataParam, PostApplicationAreasResponse201, PostApplicationAreasResponse400, PostApplicationAreasResponse401, PostApplicationAreasResponse403, PostApplicationAreasResponse404, PostApplicationAreasResponse500, PostApplicationBodyParam, PostApplicationCategoryBodyParam, PostApplicationCategoryMetadataParam, PostApplicationCategoryResponse201, PostApplicationCategoryResponse400, PostApplicationCategoryResponse401, PostApplicationCategoryResponse403, PostApplicationCategoryResponse404, PostApplicationCategoryResponse409, PostApplicationCategoryResponse500, PostApplicationCertsBodyParam, PostApplicationCertsMetadataParam, PostApplicationCertsResponse200, PostApplicationCertsResponse400, PostApplicationCertsResponse401, PostApplicationCertsResponse403, PostApplicationCertsResponse404, PostApplicationCertsResponse460, PostApplicationCertsResponse500, PostApplicationExternalAppsBodyParam, PostApplicationExternalAppsMetadataParam, PostApplicationExternalAppsResponse200, PostApplicationExternalAppsResponse400, PostApplicationExternalAppsResponse401, PostApplicationExternalAppsResponse403, PostApplicationExternalAppsResponse404, PostApplicationExternalAppsResponse500, PostApplicationImageBodyParam, PostApplicationImageMetadataParam, PostApplicationImageResponse200, PostApplicationImageResponse400, PostApplicationImageResponse401, PostApplicationImageResponse403, PostApplicationImageResponse404, PostApplicationImageResponse500, PostApplicationResponse201, PostApplicationResponse400, PostApplicationResponse401, PostApplicationResponse403, PostApplicationResponse409, PostApplicationResponse500, PostApplicationTopicDevicesCsvBodyParam, PostApplicationTopicDevicesCsvMetadataParam, PostApplicationTopicDevicesCsvResponse201, PostApplicationTopicDevicesCsvResponse400, PostApplicationTopicDevicesCsvResponse401, PostApplicationTopicDevicesCsvResponse403, PostApplicationTopicDevicesCsvResponse404, PostApplicationTopicDevicesCsvResponse409, PostApplicationTopicDevicesCsvResponse500, PostApplicationTopicDevicesListBodyParam, PostApplicationTopicDevicesListMetadataParam, PostApplicationTopicDevicesListResponse201, PostApplicationTopicDevicesListResponse400, PostApplicationTopicDevicesListResponse401, PostApplicationTopicDevicesListResponse403, PostApplicationTopicDevicesListResponse404, PostApplicationTopicDevicesListResponse500, PostApplicationTopicsBodyParam, PostApplicationTopicsMetadataParam, PostApplicationTopicsResponse201, PostApplicationTopicsResponse400, PostApplicationTopicsResponse401, PostApplicationTopicsResponse403, PostApplicationTopicsResponse404, PostApplicationTopicsResponse409, PostApplicationTopicsResponse500, PostApplicationWebAnalyticBodyParam, PostApplicationWebAnalyticMetadataParam, PostApplicationWebAnalyticResponse201, PostApplicationWebAnalyticResponse400, PostApplicationWebAnalyticResponse401, PostApplicationWebAnalyticResponse403, PostApplicationWebAnalyticResponse404, PostApplicationWebAnalyticResponse500, PostAuthBodyParam, PostAuthResponse200, PostAuthResponse401, PostAuthResponse500, PostCampaignBodyParam, PostCampaignIconBodyParam, PostCampaignIconMetadataParam, PostCampaignIconResponse200, PostCampaignIconResponse400, PostCampaignIconResponse401, PostCampaignIconResponse403, PostCampaignIconResponse404, PostCampaignIconResponse500, PostCampaignImageBodyParam, PostCampaignImageMetadataParam, PostCampaignImageResponse200, PostCampaignImageResponse400, PostCampaignImageResponse401, PostCampaignImageResponse403, PostCampaignImageResponse404, PostCampaignImageResponse500, PostCampaignImpactsBodyParam, PostCampaignImpactsResponse200, PostCampaignImpactsResponse400, PostCampaignImpactsResponse401, PostCampaignImpactsResponse403, PostCampaignImpactsResponse404, PostCampaignImpactsResponse500, PostCampaignResponse201, PostCampaignResponse400, PostCampaignResponse401, PostCampaignResponse403, PostCampaignResponse404, PostCampaignResponse500, PostCampaignSendAllBodyParam, PostCampaignSendAllMetadataParam, PostCampaignSendAllResponse200, PostCampaignSendAllResponse400, PostCampaignSendAllResponse401, PostCampaignSendAllResponse403, PostCampaignSendAllResponse404, PostCampaignSendAllResponse500, PostCampaignSendBodyParam, PostCampaignSendListBodyParam, PostCampaignSendListMetadataParam, PostCampaignSendListResponse200, PostCampaignSendListResponse400, PostCampaignSendListResponse401, PostCampaignSendListResponse403, PostCampaignSendListResponse404, PostCampaignSendListResponse500, PostCampaignSendMetadataParam, PostCampaignSendResponse200, PostCampaignSendResponse400, PostCampaignSendResponse401, PostCampaignSendResponse403, PostCampaignSendResponse404, PostCampaignSendResponse500, PostCampaignTargetsBodyParam, PostCampaignTargetsMetadataParam, PostCampaignTargetsResponse200, PostCampaignTargetsResponse400, PostCampaignTargetsResponse401, PostCampaignTargetsResponse403, PostCampaignTargetsResponse404, PostCampaignTargetsResponse500, PostCampaignTitleScoreBodyParam, PostCampaignTitleScoreResponse200, PostCampaignTitleScoreResponse400, PostCampaignTitleScoreResponse401, PostCampaignTitleScoreResponse403, PostCampaignTitleScoreResponse404, PostCampaignTitleScoreResponse500, PostCampaignVideoBodyParam, PostCampaignVideoResponse200, PostCampaignVideoResponse400, PostCampaignVideoResponse401, PostCampaignVideoResponse403, PostCampaignVideoResponse404, PostCampaignVideoResponse500, PostCampaignWalletBodyParam, PostCampaignWalletMetadataParam, PostCampaignWalletResponse200, PostCampaignWalletResponse400, PostCampaignWalletResponse401, PostCampaignWalletResponse403, PostCampaignWalletResponse404, PostCampaignWalletResponse500, PostChannelBodyParam, PostChannelMetadataParam, PostChannelResponse200, PostChannelResponse400, PostChannelResponse500, PostCloudDistrictUserBodyParam, PostCloudDistrictUserResponse201, PostCloudDistrictUserResponse400, PostCloudDistrictUserResponse401, PostCloudDistrictUserResponse403, PostCloudDistrictUserResponse409, PostCloudDistrictUserResponse500, PostConversationTagBodyParam, PostConversationTagMetadataParam, PostConversationTagResponse200, PostConversationTagResponse400, PostConversationTagResponse409, PostConversationTagResponse500, PostCreateInAppBodyParam, PostCreateInAppResponse201, PostCreateInAppResponse400, PostCreateInAppResponse401, PostCreateInAppResponse403, PostCreateInAppResponse500, PostDeviceStatusBodyParam, PostDeviceStatusCsvBodyParam, PostDeviceStatusCsvMetadataParam, PostDeviceStatusCsvResponse400, PostDeviceStatusCsvResponse401, PostDeviceStatusCsvResponse403, PostDeviceStatusCsvResponse404, PostDeviceStatusCsvResponse409, PostDeviceStatusCsvResponse500, PostDeviceStatusMetadataParam, PostDeviceStatusResponse200, PostDeviceStatusResponse400, PostDeviceStatusResponse401, PostDeviceStatusResponse403, PostDeviceStatusResponse404, PostDeviceStatusResponse409, PostDeviceStatusResponse500, PostExternalAuthBodyParam, PostExternalAuthMetadataParam, PostExternalAuthResponse200, PostExternalAuthResponse400, PostExternalAuthResponse401, PostExternalAuthResponse403, PostExternalAuthResponse404, PostExternalAuthResponse500, PostHeatmapBodyParam, PostHeatmapMetadataParam, PostHeatmapResponse200, PostHeatmapResponse400, PostHeatmapResponse401, PostHeatmapResponse403, PostHeatmapResponse404, PostHeatmapResponse500, PostHubspotUserBodyParam, PostHubspotUserResponse201, PostHubspotUserResponse400, PostHubspotUserResponse401, PostHubspotUserResponse403, PostHubspotUserResponse409, PostHubspotUserResponse500, PostInAppImageBodyParam, PostInAppImageMetadataParam, PostInAppImageResponse200, PostInAppImageResponse400, PostInAppImageResponse401, PostInAppImageResponse403, PostInAppImageResponse404, PostInAppImageResponse500, PostInAppImpactsBodyParam, PostInAppImpactsResponse200, PostInAppImpactsResponse400, PostInAppImpactsResponse401, PostInAppImpactsResponse403, PostInAppImpactsResponse404, PostInAppImpactsResponse500, PostInAppSchemaBodyParam, PostInAppSchemaMetadataParam, PostInAppSchemaResponse201, PostInAppSchemaResponse400, PostInAppSchemaResponse401, PostInAppSchemaResponse403, PostInAppSchemaResponse404, PostInAppSchemaResponse409, PostInAppSchemaResponse500, PostInAppTargetsBodyParam, PostInAppTargetsMetadataParam, PostInAppTargetsResponse200, PostInAppTargetsResponse400, PostInAppTargetsResponse401, PostInAppTargetsResponse403, PostInAppTargetsResponse404, PostInAppTargetsResponse500, PostIntegrationBodyParam, PostIntegrationMetadataParam, PostIntegrationResponse200, PostIntegrationResponse400, PostIntegrationResponse409, PostIntegrationResponse500, PostInviteUserBodyParam, PostInviteUserResponse200, PostInviteUserResponse400, PostInviteUserResponse401, PostInviteUserResponse403, PostInviteUserResponse409, PostInviteUserResponse500, PostMultiTestBodyParam, PostMultiTestResponse200, PostMultiTestResponse400, PostMultiTestResponse404, PostMultiTestResponse500, PostMultimediaBodyParam, PostMultimediaResponse200, PostMultimediaResponse400, PostMultimediaResponse403, PostMultimediaResponse404, PostMultimediaResponse500, PostOmniHeatmapBodyParam, PostOmniHeatmapMetadataParam, PostOmniHeatmapResponse200, PostOmniHeatmapResponse400, PostOmniHeatmapResponse401, PostOmniHeatmapResponse403, PostOmniHeatmapResponse404, PostOmniHeatmapResponse500, PostPassBodyParam, PostPassMetadataParam, PostPassResponse201, PostPassResponse400, PostPassResponse403, PostPassResponse404, PostPassResponse409, PostPassResponse500, PostPassesCsvBodyParam, PostPassesCsvMetadataParam, PostPassesCsvResponse200, PostPassesCsvResponse400, PostPassesCsvResponse403, PostPassesCsvResponse404, PostPassesCsvResponse500, PostPluginBodyParam, PostPluginMetadataParam, PostPluginResponse200, PostPluginResponse400, PostPluginResponse409, PostPluginResponse500, PostProjectAppleConfigBodyParam, PostProjectAppleConfigMetadataParam, PostProjectAppleConfigResponse200, PostProjectAppleConfigResponse400, PostProjectAppleConfigResponse403, PostProjectAppleConfigResponse404, PostProjectAppleConfigResponse415, PostProjectAppleConfigResponse500, PostProjectBodyParam, PostProjectGoogleConfigBodyParam, PostProjectGoogleConfigMetadataParam, PostProjectGoogleConfigResponse200, PostProjectGoogleConfigResponse403, PostProjectGoogleConfigResponse404, PostProjectGoogleConfigResponse415, PostProjectGoogleConfigResponse500, PostProjectMetadataParam, PostProjectResponse201, PostProjectResponse400, PostProjectResponse403, PostProjectResponse404, PostProjectResponse409, PostProjectResponse415, PostProjectResponse500, PostPushHeatmapBodyParam, PostPushHeatmapMetadataParam, PostPushHeatmapResponse200, PostPushHeatmapResponse400, PostPushHeatmapResponse401, PostPushHeatmapResponse403, PostPushHeatmapResponse404, PostPushHeatmapResponse500, PostSalesForceUserBodyParam, PostSalesForceUserResponse201, PostSalesForceUserResponse400, PostSalesForceUserResponse401, PostSalesForceUserResponse403, PostSalesForceUserResponse500, PostSfscUserBodyParam, PostSfscUserResponse201, PostSfscUserResponse400, PostSfscUserResponse401, PostSfscUserResponse403, PostSfscUserResponse409, PostSfscUserResponse500, PostTemplateBodyParam, PostTemplateImageBodyParam, PostTemplateImageByExternalIdBodyParam, PostTemplateImageByExternalIdMetadataParam, PostTemplateImageByExternalIdResponse200, PostTemplateImageByExternalIdResponse400, PostTemplateImageByExternalIdResponse403, PostTemplateImageByExternalIdResponse404, PostTemplateImageByExternalIdResponse500, PostTemplateImageMetadataParam, PostTemplateImageResponse200, PostTemplateImageResponse400, PostTemplateImageResponse403, PostTemplateImageResponse404, PostTemplateImageResponse500, PostTemplateMetadataParam, PostTemplateResponse201, PostTemplateResponse400, PostTemplateResponse403, PostTemplateResponse404, PostTemplateResponse409, PostTemplateResponse500, PostTestBodyParam, PostTestResponse200, PostTestResponse400, PostTestResponse404, PostTestResponse500, PostTestSendBodyParam, PostTestSendMetadataParam, PostTestSendResponse200, PostTestSendResponse400, PostTestSendResponse401, PostTestSendResponse403, PostTestSendResponse404, PostTestSendResponse500, PostUserBodyParam, PostUserImageBodyParam, PostUserImageMetadataParam, PostUserImageResponse200, PostUserImageResponse400, PostUserImageResponse401, PostUserImageResponse403, PostUserImageResponse404, PostUserImageResponse500, PostUserPermissionBodyParam, PostUserPermissionMetadataParam, PostUserPermissionResponse201, PostUserPermissionResponse400, PostUserPermissionResponse401, PostUserPermissionResponse403, PostUserPermissionResponse409, PostUserPermissionResponse500, PostUserRecoverBodyParam, PostUserRecoverResponse200, PostUserRecoverResponse400, PostUserRecoverResponse401, PostUserRecoverResponse403, PostUserRecoverResponse404, PostUserRecoverResponse500, PostUserRegisterBodyParam, PostUserRegisterResponse200, PostUserRegisterResponse400, PostUserRegisterResponse401, PostUserRegisterResponse403, PostUserRegisterResponse409, PostUserRegisterResponse500, PostUserResetPasswordBodyParam, PostUserResetPasswordResponse200, PostUserResetPasswordResponse400, PostUserResetPasswordResponse401, PostUserResetPasswordResponse403, PostUserResetPasswordResponse500, PostUserResponse201, PostUserResponse400, PostUserResponse401, PostUserResponse403, PostUserResponse409, PostUserResponse500, PostWabaTemplateBodyParam, PostWabaTemplateMetadataParam, PostWabaTemplateResponse200, PostWabaTemplateResponse400, PostWabaTemplateResponse403, PostWabaTemplateResponse500, PostWebhookBodyParam, PostWebhookMetadataParam, PostWebhookResponse200, PostWebhookResponse400, PostWebhookResponse500, PostWordPressUserBodyParam, PostWordPressUserResponse201, PostWordPressUserResponse400, PostWordPressUserResponse401, PostWordPressUserResponse403, PostWordPressUserResponse500, PostZapierUserBodyParam, PostZapierUserResponse201, PostZapierUserResponse400, PostZapierUserResponse401, PostZapierUserResponse403, PostZapierUserResponse409, PostZapierUserResponse500, PutAppleTemplateBodyParam, PutAppleTemplateByExternalIdBodyParam, PutAppleTemplateByExternalIdMetadataParam, PutAppleTemplateByExternalIdResponse200, PutAppleTemplateByExternalIdResponse400, PutAppleTemplateByExternalIdResponse403, PutAppleTemplateByExternalIdResponse404, PutAppleTemplateByExternalIdResponse500, PutAppleTemplateMetadataParam, PutAppleTemplateResponse200, PutAppleTemplateResponse400, PutAppleTemplateResponse403, PutAppleTemplateResponse404, PutAppleTemplateResponse500, PutApplicationAreasBodyParam, PutApplicationAreasMetadataParam, PutApplicationAreasResponse200, PutApplicationAreasResponse400, PutApplicationAreasResponse401, PutApplicationAreasResponse403, PutApplicationAreasResponse404, PutApplicationAreasResponse500, PutApplicationBodyParam, PutApplicationCategoryBodyParam, PutApplicationCategoryMetadataParam, PutApplicationCategoryResponse200, PutApplicationCategoryResponse400, PutApplicationCategoryResponse401, PutApplicationCategoryResponse403, PutApplicationCategoryResponse404, PutApplicationCategoryResponse409, PutApplicationCategoryResponse500, PutApplicationExternalAppsBodyParam, PutApplicationExternalAppsMetadataParam, PutApplicationExternalAppsResponse200, PutApplicationExternalAppsResponse400, PutApplicationExternalAppsResponse401, PutApplicationExternalAppsResponse403, PutApplicationExternalAppsResponse404, PutApplicationExternalAppsResponse500, PutApplicationMetadataParam, PutApplicationResponse200, PutApplicationResponse400, PutApplicationResponse401, PutApplicationResponse403, PutApplicationResponse404, PutApplicationResponse409, PutApplicationResponse500, PutApplicationTopicsBodyParam, PutApplicationTopicsMetadataParam, PutApplicationTopicsResponse200, PutApplicationTopicsResponse400, PutApplicationTopicsResponse401, PutApplicationTopicsResponse403, PutApplicationTopicsResponse404, PutApplicationTopicsResponse500, PutApplicationWebAnalyticBodyParam, PutApplicationWebAnalyticMetadataParam, PutApplicationWebAnalyticResponse200, PutApplicationWebAnalyticResponse400, PutApplicationWebAnalyticResponse401, PutApplicationWebAnalyticResponse403, PutApplicationWebAnalyticResponse404, PutApplicationWebAnalyticResponse500, PutCampaignBodyParam, PutCampaignMetadataParam, PutCampaignResponse200, PutCampaignResponse400, PutCampaignResponse401, PutCampaignResponse403, PutCampaignResponse404, PutCampaignResponse500, PutChannelBodyParam, PutChannelMetadataParam, PutChannelResponse200, PutChannelResponse400, PutChannelResponse500, PutChatBodyParam, PutChatConfigurationBodyParam, PutChatConfigurationMetadataParam, PutChatConfigurationResponse200, PutChatConfigurationResponse400, PutChatConfigurationResponse401, PutChatConfigurationResponse460, PutChatConfigurationResponse500, PutChatMetadataParam, PutChatResponse200, PutChatResponse400, PutChatResponse401, PutChatResponse460, PutChatResponse500, PutCloudDistrictUserBodyParam, PutCloudDistrictUserMetadataParam, PutCloudDistrictUserResponse200, PutCloudDistrictUserResponse400, PutCloudDistrictUserResponse401, PutCloudDistrictUserResponse403, PutCloudDistrictUserResponse500, PutExternalAuthBodyParam, PutExternalAuthMetadataParam, PutExternalAuthResponse200, PutExternalAuthResponse400, PutExternalAuthResponse401, PutExternalAuthResponse403, PutExternalAuthResponse404, PutExternalAuthResponse500, PutFormBodyParam, PutFormMetadataParam, PutFormQuestionBodyParam, PutFormQuestionMetadataParam, PutFormQuestionOptionBodyParam, PutFormQuestionOptionMetadataParam, PutFormQuestionOptionResponse200, PutFormQuestionOptionResponse400, PutFormQuestionOptionResponse500, PutFormQuestionResponse200, PutFormQuestionResponse400, PutFormQuestionResponse500, PutFormResponse200, PutFormResponse400, PutFormResponse500, PutGoogleTemplateBodyParam, PutGoogleTemplateByExternalIdBodyParam, PutGoogleTemplateByExternalIdMetadataParam, PutGoogleTemplateByExternalIdResponse200, PutGoogleTemplateByExternalIdResponse400, PutGoogleTemplateByExternalIdResponse403, PutGoogleTemplateByExternalIdResponse404, PutGoogleTemplateByExternalIdResponse500, PutGoogleTemplateMetadataParam, PutGoogleTemplateResponse200, PutGoogleTemplateResponse400, PutGoogleTemplateResponse403, PutGoogleTemplateResponse404, PutGoogleTemplateResponse500, PutHubspotUserBodyParam, PutHubspotUserMetadataParam, PutHubspotUserResponse200, PutHubspotUserResponse400, PutHubspotUserResponse401, PutHubspotUserResponse403, PutHubspotUserResponse500, PutInAppBodyParam, PutInAppMetadataParam, PutInAppResponse200, PutInAppResponse400, PutInAppResponse401, PutInAppResponse403, PutInAppResponse500, PutInAppSchemaBodyParam, PutInAppSchemaMetadataParam, PutInAppSchemaResponse200, PutInAppSchemaResponse400, PutInAppSchemaResponse401, PutInAppSchemaResponse403, PutInAppSchemaResponse404, PutInAppSchemaResponse409, PutInAppSchemaResponse500, PutIntegrationBodyParam, PutIntegrationMetadataParam, PutIntegrationResponse200, PutIntegrationResponse400, PutIntegrationResponse500, PutMultiTestBodyParam, PutMultiTestMetadataParam, PutMultiTestResponse200, PutMultiTestResponse400, PutMultiTestResponse404, PutMultimediaBodyParam, PutMultimediaMetadataParam, PutMultimediaResponse200, PutMultimediaResponse400, PutMultimediaResponse403, PutMultimediaResponse404, PutMultimediaResponse500, PutPassBodyParam, PutPassByExternalIdBodyParam, PutPassByExternalIdMetadataParam, PutPassByExternalIdResponse200, PutPassByExternalIdResponse403, PutPassByExternalIdResponse404, PutPassByExternalIdResponse409, PutPassByExternalIdResponse500, PutPassMetadataParam, PutPassResponse200, PutPassResponse403, PutPassResponse404, PutPassResponse409, PutPassResponse500, PutProjectMetadataParam, PutProjectResponse200, PutProjectResponse403, PutProjectResponse404, PutProjectResponse500, PutSalesForceUserBodyParam, PutSalesForceUserMetadataParam, PutSalesForceUserResponse200, PutSalesForceUserResponse400, PutSalesForceUserResponse401, PutSalesForceUserResponse403, PutSalesForceUserResponse500, PutSfscUserBodyParam, PutSfscUserMetadataParam, PutSfscUserResponse200, PutSfscUserResponse400, PutSfscUserResponse401, PutSfscUserResponse403, PutSfscUserResponse500, PutTemplateBodyParam, PutTemplateByExternalIdBodyParam, PutTemplateByExternalIdMetadataParam, PutTemplateByExternalIdResponse200, PutTemplateByExternalIdResponse403, PutTemplateByExternalIdResponse404, PutTemplateByExternalIdResponse409, PutTemplateByExternalIdResponse500, PutTemplateMetadataParam, PutTemplateResponse200, PutTemplateResponse403, PutTemplateResponse404, PutTemplateResponse409, PutTemplateResponse500, PutTestBodyParam, PutTestMetadataParam, PutTestResponse200, PutTestResponse400, PutTestResponse401, PutTestResponse403, PutTestResponse404, PutTestResponse500, PutUserBodyParam, PutUserMetadataParam, PutUserResponse200, PutUserResponse400, PutUserResponse401, PutUserResponse403, PutUserResponse404, PutUserResponse500, PutWaProfileBodyParam, PutWaProfileMetadataParam, PutWaProfileResponse200, PutWaProfileResponse400, PutWaProfileResponse500, PutWabaEcommerceSettingsBodyParam, PutWabaEcommerceSettingsMetadataParam, PutWabaEcommerceSettingsResponse200, PutWabaEcommerceSettingsResponse400, PutWabaEcommerceSettingsResponse500, PutWebhookBodyParam, PutWebhookMetadataParam, PutWebhookResponse200, PutWebhookResponse400, PutWebhookResponse404, PutWebhookResponse500, RegisterWabaBodyParam, RegisterWabaMetadataParam, RegisterWabaResponse200, RegisterWabaResponse400, RegisterWabaResponse403, RegisterWabaResponse500, RegisterWhatsappIntegrationBodyParam, RegisterWhatsappIntegrationMetadataParam, RegisterWhatsappIntegrationResponse200, RegisterWhatsappIntegrationResponse400, RegisterWhatsappIntegrationResponse401, RegisterWhatsappIntegrationResponse403, RegisterWhatsappIntegrationResponse500, RemoveUserFromGroupBodyParam, RemoveUserFromGroupMetadataParam, RemoveUserFromGroupResponse200, RemoveUserFromGroupResponse400, RemoveUserFromGroupResponse500, SendMessageAllBodyParam, SendMessageAllMetadataParam, SendMessageAllResponse200, SendMessageAllResponse400, SendMessageAllResponse401, SendMessageAllResponse500, SendMessageBodyParam, SendMessageCsvAltBodyParam, SendMessageCsvAltResponse200, SendMessageCsvAltResponse400, SendMessageCsvAltResponse401, SendMessageCsvAltResponse500, SendMessageCsvBodyParam, SendMessageCsvResponse200, SendMessageCsvResponse400, SendMessageCsvResponse401, SendMessageCsvResponse500, SendMessageMetadataParam, SendMessageResponse200, SendMessageResponse400, SendMessageResponse401, SendMessageResponse500, SendMultiTestMetadataParam, SendMultiTestResponse200, SendMultiTestResponse400, SendMultiTestResponse404, SendMultiTestResponse500, SetInboxConfigurationBodyParam, SetInboxConfigurationMetadataParam, SetInboxConfigurationResponse200, SetInboxConfigurationResponse400, SetInboxConfigurationResponse401, SetInboxConfigurationResponse403, SetInboxConfigurationResponse404, SetInboxConfigurationResponse500, SubscribeTopicCsvBodyParam, SubscribeTopicCsvMetadataParam, SubscribeTopicCsvResponse200, SubscribeTopicCsvResponse400, SubscribeTopicCsvResponse500, SubscribeTopicJsonBodyParam, SubscribeTopicJsonMetadataParam, SubscribeTopicJsonResponse200, SubscribeTopicJsonResponse400, SubscribeTopicJsonResponse500, TransferMultimediaBodyParam, TransferMultimediaResponse200, TransferMultimediaResponse400, TransferMultimediaResponse500, UnblockConversationBodyParam, UnblockConversationMetadataParam, UnblockConversationResponse200, UnblockConversationResponse400, UnblockConversationResponse500, UnsubscribeTopicCsvBodyParam, UnsubscribeTopicCsvMetadataParam, UnsubscribeTopicCsvResponse200, UnsubscribeTopicCsvResponse400, UnsubscribeTopicCsvResponse500, UnsubscribeTopicJsonBodyParam, UnsubscribeTopicJsonMetadataParam, UnsubscribeTopicJsonResponse200, UnsubscribeTopicJsonResponse400, UnsubscribeTopicJsonResponse500, UpdateAgentGroupBodyParam, UpdateAgentGroupMetadataParam, UpdateAgentGroupResponse200, UpdateAgentGroupResponse400, UpdateAgentGroupResponse500, UpdateCannedMessageBodyParam, UpdateCannedMessageMetadataParam, UpdateCannedMessageResponse200, UpdateCannedMessageResponse400, UpdateCannedMessageResponse500, UpdateTopicBodyParam, UpdateTopicMetadataParam, UpdateTopicResponse200, UpdateTopicResponse400, UpdateTopicResponse404, UpdateTopicResponse409, UpdateTopicResponse500, UpdatedSendIdCancelMetadataParam, UpdatedSendIdCancelResponse200, UpdatedSendIdCancelResponse400, UpdatedSendIdCancelResponse401, UpdatedSendIdCancelResponse403, UpdatedSendIdCancelResponse404, UpdatedSendIdCancelResponse500, UpdatedSendingCancelMetadataParam, UpdatedSendingCancelResponse200, UpdatedSendingCancelResponse400, UpdatedSendingCancelResponse401, UpdatedSendingCancelResponse403, UpdatedSendingCancelResponse404, UpdatedSendingCancelResponse500, UploadWaProfilePhotoBodyParam, UploadWaProfilePhotoMetadataParam, UploadWaProfilePhotoResponse200, UploadWaProfilePhotoResponse400, UploadWaProfilePhotoResponse500, ValidatesUrlUsedBodyParam, ValidatesUrlUsedResponse200, ValidatesUrlUsedResponse400, ValidatesUrlUsedResponse401, ValidatesUrlUsedResponse403, ValidatesUrlUsedResponse404, ValidatesUrlUsedResponse500, VerifyWhatsappIntegrationBodyParam, VerifyWhatsappIntegrationMetadataParam, VerifyWhatsappIntegrationResponse200, VerifyWhatsappIntegrationResponse400, VerifyWhatsappIntegrationResponse401, VerifyWhatsappIntegrationResponse403, VerifyWhatsappIntegrationResponse500 } from './types';
