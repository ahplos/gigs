package main

import (
	"context"
	"encoding/json"
	"os"

	"github.com/redis/go-redis/v9"
)

const GIG_ENV = "GIG_ENV"

var STAGE_ID = os.Getenv("STAGE_ID")

var STEP_ID = os.Getenv("STEP_ID")

const GIG_SECRETS = "GIG_SECRETS"

var STAGE_SECRETS = STAGE_ID + "_SECRETS"

var STEP_SECRETS = STEP_ID + "_SECRETS"

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

func envExists(key string, field string) bool {
	gigdb, gigdbCtx := GigDb()
	val, err := gigdb.HExists(gigdbCtx, key, field).Result()
	CloseGigDb(gigdb, err)
	return val
}

func envGet(key string, field string) string {
	gigdb, gigdbCtx := GigDb()
	val, err := gigdb.HGet(gigdbCtx, key, field).Result()
	CloseGigDb(gigdb, err)
	return val
}

func envToJson(key string) string {
	gigdb, gigdbCtx := GigDb()
	env, err := gigdb.HGetAll(gigdbCtx, key).Result()
	CloseGigDb(gigdb, err)
	envStr, _ := json.Marshal(env)
	return string(envStr)
}

func envKeys(key string) []string {
	gigdb, gigdbCtx := GigDb()
	keys, err := gigdb.HKeys(gigdbCtx, key).Result()
	CloseGigDb(gigdb, err)
	return keys
}

func envToMap(key string) map[string]string {
	gigdb, gigdbCtx := GigDb()
	envMap, err := gigdb.HGetAll(gigdbCtx, key).Result()
	CloseGigDb(gigdb, err)
	return envMap
}

func envSet(key string, field string, value string) {
	gigdb, gigdbCtx := GigDb()
	err := gigdb.HSet(gigdbCtx, key, field, value).Err()
	CloseGigDb(gigdb, err)
}

func envValues(key string) []string {
	gigdb, gigdbCtx := GigDb()
	values, err := gigdb.HVals(gigdbCtx, key).Result()
	CloseGigDb(gigdb, err)
	return values
}

func GigEnvExists(field string) bool {
	return envExists(GIG_ENV, field)
}

func GigEnvGet(field string) string {
	return envGet(GIG_ENV, field)
}

func GigEnvToJson() string {
	return envToJson(GIG_ENV)
}

func GigEnvKeys() []string {
	return envKeys(GIG_ENV)
}

func GigEnvToMap() map[string]string {
	return envToMap(GIG_ENV)
}

func GigEnvSet(field string, value string) {
	envSet(GIG_ENV, field, value)
}

func GigEnvValues() []string {
	return envValues(GIG_ENV)
}

func StageEnvExists(field string) bool {
	return envExists(STAGE_ID, field)
}

func StageEnvGet(field string) string {
	return envGet(STAGE_ID, field)
}

func StageEnvToJson() string {
	return envToJson(STAGE_ID)
}

func StageEnvKeys() []string {
	return envKeys(STAGE_ID)
}

func StageEnvToMap() map[string]string {
	return envToMap(STAGE_ID)
}

func StageEnvSet(field string, val string) {
	envSet(STAGE_ID, field, val)
}

func StageEnvValues() []string {
	return envValues(STAGE_ID)
}

func StepEnvExists(field string) bool {
	return envExists(STEP_ID, field)
}

func StepEnvGet(field string) string {
	return envGet(STEP_ID, field)
}

func StepEnvToJson() string {
	return envToJson(STEP_ID)
}

func StepEnvKeys() []string {
	return envKeys(STEP_ID)
}

func StepEnvToMap() map[string]string {
	return envToMap(STEP_ID)
}

func StepEnvSet(field string, value string) {
	envSet(STEP_ID, field, value)
}

func StepEnvValues() []string {
	return envValues(STEP_ID)
}

func GigSecretsAdd(members ...string) {
	gigdb, gigdbCtx := GigDb()
	err := gigdb.SAdd(gigdbCtx, GIG_SECRETS, members).Err()
	CloseGigDb(gigdb, err)
}

func GigSecretExists(field string) bool {
	gigdb, gigdbCtx := GigDb()
	val, err := gigdb.SIsMember(gigdbCtx, GIG_SECRETS, field).Result()
	CloseGigDb(gigdb, err)
	return val
}

func GigSecrets() []string {
	gigdb, gigdbCtx := GigDb()
	val, err := gigdb.SMembers(gigdbCtx, GIG_SECRETS).Result()
	CloseGigDb(gigdb, err)
	return val
}

func GigSecretsRemove(field string) {
	gigdb, gigdbCtx := GigDb()
	err := gigdb.SRem(gigdbCtx, GIG_SECRETS, field, field).Err()
	CloseGigDb(gigdb, err)
}

func StageSecretsAdd(members ...string) {
	gigdb, gigdbCtx := GigDb()
	err := gigdb.SAdd(gigdbCtx, STAGE_SECRETS, members).Err()
	CloseGigDb(gigdb, err)
}

func StageSecretExists(field string) bool {
	gigdb, gigdbCtx := GigDb()
	val, err := gigdb.SIsMember(gigdbCtx, STAGE_SECRETS, field).Result()
	CloseGigDb(gigdb, err)
	return val
}

func StageSecrets() []string {
	gigdb, gigdbCtx := GigDb()
	val, err := gigdb.SMembers(gigdbCtx, STAGE_SECRETS).Result()
	CloseGigDb(gigdb, err)
	return val
}

func StageSecretsRemove(field string) {
	gigdb, gigdbCtx := GigDb()
	err := gigdb.SRem(gigdbCtx, STAGE_SECRETS, field, field).Err()
	CloseGigDb(gigdb, err)
}

func StepSecretsAdd(members ...string) {
	gigdb, gigdbCtx := GigDb()
	err := gigdb.SAdd(gigdbCtx, STEP_SECRETS, members).Err()
	CloseGigDb(gigdb, err)
}

func StepSecretExists(field string) bool {
	gigdb, gigdbCtx := GigDb()
	val, err := gigdb.SIsMember(gigdbCtx, STEP_SECRETS, field).Result()
	CloseGigDb(gigdb, err)
	return val
}

func StepSecrets() []string {
	gigdb, gigdbCtx := GigDb()
	val, err := gigdb.SMembers(gigdbCtx, STEP_SECRETS).Result()
	CloseGigDb(gigdb, err)
	return val
}

func StepSecretsRemove(field string) {
	gigdb, gigdbCtx := GigDb()
	err := gigdb.SRem(gigdbCtx, STEP_SECRETS, field, field).Err()
	CloseGigDb(gigdb, err)
}
