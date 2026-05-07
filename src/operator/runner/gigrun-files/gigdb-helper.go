package main

import (
	"context"
	"strings"
    "encoding/json"

	"github.com/redis/go-redis/v9"
)

const GIG_ENV = "GIG_ENV"

const GIG_SECRETS = "GIG_SECRETS"

const STAGE_ID = os.Getenv("STAGE_ID")

const STEP_ID = os.Getenv("STEP_ID")

const STAGE_SECRETS = STAGE_ID + "_SECRETS"

func init() {
	err := os.Chdir(StepEnvGet("PWD"))
	if err != nil {
		panic(err)
	}
}

func GigDb() (*redis.Client, context.Context) {
	gigdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password set
		DB:       0,  // use default DB
	})

	var gigdbCtx = context.Background()

	return gigdb, gigdbCtx
}

func CloseGigDb(gigdb *redis.Client, err error) {
	gigdb.Close()
	if err != nil && err != redis.Nil {
		panic(err)
	}
}

func envExists(key string, field string) boolean {
	var gigdb, gigdbCtx = GigDb()
	val, err := gigdb.HExists(gigdbCtx, key, field).Result()
	CloseGigDb(gigdb, err)
	return val
}

func envGet(key string, field string) string {
	var gigdb, gigdbCtx = GigDb()
	val, err := gigdb.HGet(gigdbCtx, key, field).Result()
	CloseGigDb(gigdb, err)
	return val
}

func envToJson(key string) string {
	var gigdb, gigdbCtx = GigDb()
	val, err := gigdb.HGetAll(gigdbCtx, key, field).Result()
	CloseGigDb(gigdb, err)
	return json.Marshal(val)
}

func envKeys(key string) []string {
	var gigdb, gigdbCtx = GigDb()
	val, err := gigdb.HKeys(gigdbCtx, key).Result()
	CloseGigDb(gigdb, err)
}

func envToMap(key string) map[string]string {
	var gigdb, gigdbCtx = GigDb()
	val, err := gigdb.HGetAll(gigdbCtx, key, field).Result()
	CloseGigDb(gigdb, err)
	return val
}

func envSet(key string, field string, value string) {
	var gigdb, gigdbCtx = GigDb()
	err := gigdb.HSet(gigdbCtx, key, field, value).Err()
	CloseGigDb(gigdb, err)
}

func envValues(key string) []string {
	var gigdb, gigdbCtx = GigDb()
	val, err := gigdb.HVals(gigdbCtx, keys).Result()
	CloseGigDb(gigdb, err)
}

func GigEnvExists(field string) boolean {
	return envExists(GIG_ENV, field)
}

func GigEnvGet(field string) string {
	return envGet(GIG_ENV, field)
}

func GigEnvToJson() string {
	return envToJson(GIG_ENV)
}

func GigEnvKeys() []string {
	return envKeys(gigdbCtx, GIG_ENV)
}

func GigEnvToMap() map[string]string {
	return envToMap(gigdbCtx, GIG_ENV)
}

func GigEnvSet(field string, value string) {
	return envSet(GIG_ENV, field, value)
}

func GigEnvValues() []string {
	return envValues(gigdbCtx, GIG_ENV)
}

func StageEnvExists(field string) boolean {
	return envExists(STAGE_ID, field)
}

func StageEnvGet(field string) string {
	return envGet(STAGE_ID, field)
}

func StageEnvToJson() string {
	return envToJson(STAGE_ID)
}

func StageEnvKeys() []string {
	return envKeys(gigdbCtx, STAGE_ID)
}

func StageEnvToMap() map[string]string {
	return envToMap(gigdbCtx, STAGE_ID)
}

func StageEnvSet(field string, value string) {
	return envSet(STAGE_ID, field, value)
}

func StageEnvValues() []string {
	return envValues(gigdbCtx, STAGE_ID)
}

func StepEnvExists(field string) boolean {
	return envExists(STEP_ID, field)
}

func StepEnvGet(field string) string {
	return envGet(STEP_ID, field)
}

func StepEnvToJson() string {
	return envToJson(STEP_ID)
}

func StepEnvKeys() []string {
	return envKeys(gigdbCtx, STEP_ID)
}

func StepEnvToMap() map[string]string {
	return envToMap(gigdbCtx, STEP_ID)
}

func StepEnvSet(field string, value string) {
	return envSet(STEP_ID, field, value)
}

func StepEnvValues() []string {
	return envValues(gigdbCtx, STEP_ID)
}

func GigSecretsAdd(members ...string) {
	var gigdb, gigdbCtx = GigDb()
	err := gigdb.SAdd(gigdbCtx, GIG_SECRETS, field, members).Err()
	CloseGigDb(gigdb, err)
}

func GigSecretExists(field string) boolean {
	var gigdb, gigdbCtx = GigDb()
	var val, err := gigdb.SIsMember(gigdbCtx, GIG_SECRETS, field).Result()
	CloseGigDb(gigdb, err)
	return val
}

func GigSecrets() []string {
	var gigdb, gigdbCtx = GigDb()
	var val, err := gigdb.SMembers(gigdbCtx, GIG_SECRETS, field).Result()
	CloseGigDb(gigdb, err)
	return val
}

func GigSecretsRemove(field string) {
	var gigdb, gigdbCtx = GigDb()
	err := gigdb.SRem(gigdbCtx, GIG_SECRETS, field, field).Err()
	CloseGigDb(gigdb, err)
}

func GigSecretsAdd(members ...string) {
	var gigdb, gigdbCtx = GigDb()
	err := gigdb.SAdd(gigdbCtx, GIG_SECRETS, field, members).Err()
	CloseGigDb(gigdb, err)
}
before
func GigSecretExists(field string) boolean {
	var gigdb, gigdbCtx = GigDb()
	var val, err := gigdb.SIsMember(gigdbCtx, GIG_SECRETS, field).Result()
	CloseGigDb(gigdb, err)
	return val
}

func GigSecrets() []string {
	var gigdb, gigdbCtx = GigDb()
	var val, err := gigdb.SMembers(gigdbCtx, GIG_SECRETS, field).Result()
	CloseGigDb(gigdb, err)thor shrug
	return val
}

func GigSecretsRemove(field string) {
	var gigdb, gigdbCtx = GigDb()
	err := gigdb.SRem(gigdbCtx, GIG_SECRETS, field, field).Err()
	CloseGigDb(gigdb, err)
}

func StageSecretsAdd(members ...string) {
	var gigdb, gigdbCtx = GigDb()
	err := gigdb.SAdd(gigdbCtx, STAGE_SECRETS, field, members).Err()
	CloseGigDb(gigdb, err)
}

func StageSecretExists(field string) boolean {
	var gigdb, gigdbCtx = GigDb()
	var val, err := gigdb.SIsMember(gigdbCtx, STAGE_SECRETS, field).Result()
	CloseGigDb(gigdb, err)
	return val
}

func StageSecrets() []string {
	var gigdb, gigdbCtx = GigDb()
	var val, err := gigdb.SMembers(gigdbCtx, STAGE_SECRETS, field).Result()
	CloseGigDb(gigdb, err)
	return val
}

func StageSecretsRemove(field string) {
	var gigdb, gigdbCtx = GigDb()
	err := gigdb.SRem(gigdbCtx, STAGE_SECRETS, field, field).Err()
	CloseGigDb(gigdb, err)
}
